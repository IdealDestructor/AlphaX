import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Smart-money intelligence: ETF net flows, COMEX positioning, COT and central
 * bank purchases. Currently a deterministic snapshot generator over the seeded
 * Symbols table (see apps/api/prisma/seed.ts); a real feed should back
 * `smart_money_snapshots` and replace `generateSnapshot`.
 */
@Injectable()
export class SmartMoneyService {
  private static readonly DAYS = 14;

  constructor(private prisma: PrismaService) {}

  async getSmartMoney() {
    const symbols = await this.prisma.symbol.findMany({ where: { isActive: true } });
    const items = symbols.map((s, i) => ({
      symbol: s.code,
      ...this.generateSnapshot(s.code, i, 0),
      history: this.generateHistory(s.code, i),
    }));
    return { items, generatedAt: new Date().toISOString() };
  }

  async getSmartMoneyBySymbol(symbolCode: string) {
    const symbol = await this.prisma.symbol.findUnique({ where: { code: symbolCode } });
    if (!symbol) return null;
    const index = this.index(symbolCode);
    return {
      symbol: symbol.code,
      ...this.generateSnapshot(symbolCode, index, 0),
      history: this.generateHistory(symbolCode, index),
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
        ...this.generateSnapshot(symbolCode, index, i),
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

  private generateSnapshot(code: string, seed: number, dayOffset: number) {
    const r = this.rand(seed * 997 + dayOffset * 31);
    const base = 50 + r() * 200;
    const etf = {
      netFlow: Math.round((base * (r() - 0.45) * 10)) / 10,
      cumulative: Math.round((base * (0.5 + r())) * 10) / 10,
    };
    const cot = {
      specLong: Math.round(10000 + r() * 80000),
      specShort: Math.round(10000 + r() * 60000),
      netSpecLong: Math.round(10000 * (r() - 0.35)),
    };
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
    };
  }

  private generateHistory(code: string, seed: number) {
    const days = SmartMoneyService.DAYS;
    const out: Array<Record<string, unknown>> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const snap = this.generateSnapshot(code, seed, i);
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
