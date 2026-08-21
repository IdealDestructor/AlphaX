import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CotProvider, CotSnapshot } from './providers/cot.provider';

/**
 * Smart-money intelligence: ETF net flows, COMEX positioning, COT and central
 * bank purchases.
 *
 * 真实化进度（2026-08-21）：
 * - COT：接入 CFTC 官方每周报告（真实，sources.cot='cftc'）；失败降级确定性估算（'mock'）
 * - ETF 净流入 / 央行购金：暂无可靠免费 API，保留确定性估算并如实标注 sources
 * 产品原则：源挂了如实报缺，不填空。
 */
@Injectable()
export class SmartMoneyService {
  private static readonly DAYS = 14;

  constructor(
    private prisma: PrismaService,
    private cotProvider: CotProvider,
  ) {}

  async getSmartMoney() {
    const [symbols, cot] = await Promise.all([
      this.prisma.symbol.findMany({ where: { isActive: true } }),
      this.cotProvider.getSnapshot(),
    ]);
    const cotMap = new Map((cot?.items ?? []).map((c) => [c.symbol, c]));

    const items = symbols.map((s, i) => {
      const snap = this.generateSnapshot(s.code, i, 0, cotMap.get(s.code) ?? null);
      return {
        symbol: s.code,
        ...snap,
        history: this.generateHistory(s.code, i, cotMap.get(s.code) ?? null),
        sources: snap.sources,
      };
    });

    return {
      items,
      generatedAt: new Date().toISOString(),
      cot: cot
        ? { asOf: cot.asOf, reportDate: cot.reportDate, source: 'cftc' }
        : { asOf: null, reportDate: null, source: 'mock' },
    };
  }

  async getSmartMoneyBySymbol(symbolCode: string) {
    const symbol = await this.prisma.symbol.findUnique({ where: { code: symbolCode } });
    if (!symbol) return null;
    const cot = await this.cotProvider.getSnapshot();
    const cotItem = cot?.items.find((c) => c.symbol === symbolCode) ?? null;
    const index = this.index(symbolCode);
    const snap = this.generateSnapshot(symbolCode, index, 0, cotItem);
    return {
      symbol: symbol.code,
      ...snap,
      history: this.generateHistory(symbolCode, index, cotItem),
      sources: snap.sources,
    };
  }

  async getSmartMoneyHistory(symbolCode: string, days: number = 14, limit: number = 30) {
    const symbol = await this.prisma.symbol.findUnique({ where: { code: symbolCode } });
    if (!symbol) return [];
    const cap = Math.max(1, Math.min(limit, 90));
    const index = this.index(symbolCode);
    const list: Array<Record<string, unknown>> = [];
    for (let i = 0; i < cap; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      list.push({
        date: d,
        ...this.generateSnapshot(symbolCode, index, i, null),
      });
    }
    return list.slice(0, Math.max(1, Math.min(days, cap)));
  }

  /** Reproducible pseudo-random generator so a symbol always yields the same series. */
  private rand(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967295;
    };
  }

  /** 生成快照；COT 有真实值时覆盖随机估算。 */
  private generateSnapshot(
    code: string,
    seed: number,
    dayOffset: number,
    cotReal: CotSnapshot['items'][number] | null,
  ) {
    const r = this.rand(seed * 997 + dayOffset * 31);
    const base = 50 + r() * 200;
    const etf = {
      netFlow: Math.round((base * (r() - 0.45) * 10)) / 10,
      cumulative: Math.round((base * (0.5 + r())) * 10) / 10,
    };
    // COT：优先真实值；无真实值时用确定性估算（标注 mock）
    const cot = cotReal
      ? { specLong: cotReal.specLong, specShort: cotReal.specShort, netSpecLong: cotReal.netSpecLong }
      : this.estimateCot(r);
    const centralBank = {
      purchasesTonnes: Math.round(5 + r() * 40),
      trend: r() > 0.55 ? 'accumulating' : 'neutral',
    };
    return {
      etf,
      cot,
      centralBank,
      signal: this.toSignal(etf.netFlow, cot.netSpecLong),
      dayOffset,
      sources: {
        cot: cotReal ? 'cftc' as const : 'mock' as const,
        etf: 'mock' as const,
        centralBank: 'mock' as const,
      },
    };
  }

  private estimateCot(r: () => number) {
    return {
      specLong: Math.round(10000 + r() * 80000),
      specShort: Math.round(10000 + r() * 60000),
      netSpecLong: Math.round(10000 * (r() - 0.35)),
    };
  }

  private generateHistory(code: string, seed: number, cotReal: CotSnapshot['items'][number] | null) {
    const days = SmartMoneyService.DAYS;
    const out: Array<Record<string, unknown>> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const snap = this.generateSnapshot(code, seed, i, cotReal);
      out.push({ date: d, etf: snap.etf.netFlow, cotNet: snap.cot.netSpecLong, cb: snap.centralBank.purchasesTonnes });
    }
    return out;
  }

  private toSignal(etf: number, cot: number): { direction: string; strength: number } {
    const score = Math.sign(etf) * Math.min(1, Math.abs(etf) / 100) + Math.sign(cot) * Math.min(1, Math.abs(cot) / 30000);
    const aggr = Math.max(-1, Math.min(1, score));
    const direction = aggr > 0.2 ? 'accumulate' : aggr < -0.2 ? 'distribute' : 'neutral';
    return { direction, strength: Math.abs(aggr) };
  }

  private index(code: string): number {
    let h = 0;
    for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
    return h;
  }
}
