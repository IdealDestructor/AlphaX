import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';

/**
 * 智能分析生成。
 *
 * 真实化进度（2026-08-21）：不再 Math.random 编造结论。
 * - trend/action/confidence/levels 由真实 K 线与指标（EMA/RSI/MACD/BB/ATR）确定性计算
 * - reasons/evidence 只引用真实指标事实，不编造 pattern
 * - modelVersion 标注 `rule-v2.1`（规则引擎）；真实 LLM 多 Agent 推理在 P2 接入 apps/ai
 */
@Injectable()
export class AnalysisService {
  constructor(
    private prisma: PrismaService,
    private market: MarketService,
  ) {}

  async getAnalysis(symbol: string, timeframe: string = '1d') {
    const symbolRecord = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!symbolRecord) return null;

    const existing = await this.prisma.aiAnalysis.findFirst({
      where: { symbolId: symbolRecord.id, timeframe },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return this.formatAnalysis(existing, symbol);
    }

    return this.generateAndSave(symbolRecord, symbol, timeframe);
  }

  async getHistory(symbol: string, timeframe: string = '1d', limit: number = 20) {
    const symbolRecord = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!symbolRecord) return [];

    const analyses = await this.prisma.aiAnalysis.findMany({
      where: { symbolId: symbolRecord.id, timeframe },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return analyses.map((a) => ({
      id: a.id,
      trend: a.trend,
      action: a.action,
      confidence: a.confidence.toNumber(),
      entry: a.entry?.toNumber() ?? null,
      stopLoss: a.stopLoss?.toNumber() ?? null,
      takeProfit: a.takeProfit?.toNumber() ?? null,
      riskLevel: a.riskLevel,
      summary: a.summary,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /** Force a fresh pipeline run, bypassing the cached latest analysis. */
  async refreshAnalysis(symbol: string, timeframe: string = '1d') {
    const symbolRecord = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!symbolRecord) return null;
    return this.generateAndSave(symbolRecord, symbol, timeframe);
  }

  private formatAnalysis(a: any, symbol: string) {
    return {
      symbol,
      timeframe: a.timeframe,
      trend: a.trend,
      action: a.action,
      confidence: a.confidence.toNumber(),
      entry: a.entry?.toNumber() ?? null,
      stopLoss: a.stopLoss?.toNumber() ?? null,
      takeProfit: a.takeProfit?.toNumber() ?? null,
      riskLevel: a.riskLevel,
      summary: a.summary,
      reasons: a.reasons,
      evidence: a.evidence,
      modelVersions: a.modelVersion,
      createdAt: a.createdAt.toISOString(),
    };
  }

  /** 前端周期 → 行情 interval */
  private intervalFor(timeframe: string): string {
    const map: Record<string, string> = {
      '15m': '15m',
      '1h': '1h',
      '1H': '1h',
      '4h': '4h',
      '4H': '4h',
      '1d': '1d',
      '1D': '1d',
    };
    return map[timeframe] ?? '1d';
  }

  private async generateAndSave(symbolRecord: any, symbol: string, timeframe: string) {
    const interval = this.intervalFor(timeframe);
    const candles = await this.market.getCandles(symbol, interval, 200);
    const indicators = await this.market.getIndicators(symbol, interval, ['sma', 'ema', 'rsi', 'macd', 'bb']);

    const rule = this.evaluate(candles, indicators);
    const summary = `${rule.trend === 'bullish' ? '看涨' : rule.trend === 'bearish' ? '看跌' : '震荡'}趋势，建议${rule.action === 'buy' ? '做多' : rule.action === 'sell' ? '做空' : '观望'}。`;

    const saved = await this.prisma.aiAnalysis.create({
      data: {
        symbolId: symbolRecord.id,
        timeframe,
        trend: rule.trend,
        action: rule.action,
        confidence: rule.confidence,
        entry: rule.entry,
        stopLoss: rule.stopLoss,
        takeProfit: rule.takeProfit,
        riskLevel: rule.riskLevel,
        summary,
        reasons: rule.reasons,
        evidence: rule.evidence,
        modelVersion: {
          version: 'rule-v2.1',
          generatedAt: new Date().toISOString(),
          note: '确定性规则（真实行情），P2 接入 LLM',
        },
      },
    });

    return this.formatAnalysis(saved, symbol);
  }

  /** 基于真实蜡烛与指标做确定性评分。 */
  private evaluate(candles: any[], indicators: any) {
    const lastClose = candles.length ? candles[candles.length - 1]!.close : null;
    if (lastClose == null) {
      return this.neutral('无行情数据', 0.4, null);
    }

    const rsi = lastValue(indicators?.rsi);
    const ema20 = lastValue(indicators?.ema);
    const sma20 = lastValue(indicators?.sma);
    const macd = indicators?.macd as
      | { macdLine?: { value: number }[]; signal?: { value: number }[]; histogram?: { value: number }[] }
      | undefined;
    const macdHist = macd?.histogram?.[macd.histogram.length - 1]?.value;
    const bb = indicators?.bb as
      | { upper?: { value: number }[]; middle?: { value: number }[]; lower?: { value: number }[] }
      | undefined;
    const bbMiddle = lastValue(bb?.middle);
    const bbUpper = lastValue(bb?.upper);
    const bbLower = lastValue(bb?.lower);
    const atrFrac = this.atrFraction(candles);

    // 方向信号打分（每条证据都是真实指标事实）
    const facts: Array<{ signal: string; weight: number; dir: number }> = [];
    if (ema20 != null) {
      const bull = lastClose >= ema20;
      facts.push({ signal: `价格 ${bull ? '站上' : '跌破'} EMA20 (${ema20.toFixed(2)})`, weight: 0.2, dir: bull ? 1 : -1 });
    }
    if (sma20 != null) {
      const bull = lastClose >= sma20;
      facts.push({ signal: `价格 ${bull ? '高于' : '低于'} SMA20 (${sma20.toFixed(2)})`, weight: 0.15, dir: bull ? 1 : -1 });
    }
    if (rsi != null) {
      const dir = rsi > 55 ? 1 : rsi < 45 ? -1 : 0;
      facts.push({ signal: `RSI(14) = ${rsi.toFixed(1)}${rsi >= 70 ? '（超买）' : rsi <= 30 ? '（超卖）' : ''}`, weight: 0.2, dir });
    }
    if (macdHist != null) {
      const dir = macdHist >= 0 ? 1 : -1;
      facts.push({ signal: `MACD 柱 ${dir > 0 ? '转正' : '转负'} (${macdHist.toFixed(3)})`, weight: 0.2, dir });
    }
    if (bbMiddle != null && bbUpper != null && bbLower != null) {
      const dir = lastClose >= bbMiddle ? 1 : -1;
      const zone = lastClose >= bbUpper ? '触及上轨' : lastClose <= bbLower ? '触及下轨' : '轨道内';
      facts.push({ signal: `价格${zone} BB(20,2)`, weight: 0.15, dir });
    }

    const totalWeight = facts.reduce((a, f) => a + f.weight, 0) || 1;
    const score = facts.reduce((a, f) => a + f.dir * f.weight, 0) / totalWeight; // -1..1
    const agreement = facts.length > 0 ? facts.reduce((a, f) => a + (f.dir !== 0 ? 1 : 0), 0) / facts.length : 0;

    const trend = score > 0.15 ? 'bullish' : score < -0.15 ? 'bearish' : 'neutral';
    const action = trend === 'neutral' ? 'hold' : trend === 'bullish' ? (rsi != null && rsi >= 72 ? 'hold' : 'buy') : (rsi != null && rsi <= 28 ? 'hold' : 'sell');
    const confidence = Math.round((0.5 + Math.abs(score) * 0.4 + agreement * 0.1) * 10000) / 10000;
    const riskLevel = atrFrac > 0.03 ? 'high' : atrFrac > 0.015 ? 'medium' : 'low';

    const atr = lastClose * atrFrac;
    const dir = trend === 'bullish' ? 1 : trend === 'bearish' ? -1 : 0;
    const entry = Math.round((lastClose + dir * atr * 0.2) * 100) / 100;
    const stopLoss = Math.round((entry - dir * atr * 1.5) * 100) / 100;
    const takeProfit = Math.round((entry + dir * atr * 3) * 100) / 100;

    const evidence = facts.slice(0, 4).map((f) => ({
      source: f.dir > 0 ? '技术 · 多头' : f.dir < 0 ? '技术 · 空头' : '技术 · 中性',
      signal: f.signal,
      weight: Math.round(f.weight * 100) / 100,
    }));

    const reasons = facts.slice(0, 4).map((f) => f.signal);
    if (reasons.length === 0) reasons.push('行情数据不足，无法形成有效信号');

    return { trend, action, confidence, riskLevel, entry, stopLoss, takeProfit, reasons, evidence };
  }

  private atrFraction(candles: any[]): number {
    if (candles.length < 2) return 0.02;
    const trs: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i]!;
      const p = candles[i - 1]!;
      trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
    }
    const win = trs.slice(-14);
    const atr = win.length ? win.reduce((a, b) => a + b, 0) / win.length : 0;
    const close = candles[candles.length - 1]!.close;
    return close > 0 ? atr / close : 0.02;
  }

  private neutral(reason: string, confidence: number, close: number | null) {
    return {
      trend: 'neutral' as const,
      action: 'hold' as const,
      confidence,
      riskLevel: 'medium' as const,
      entry: close != null ? Math.round(close * 100) / 100 : null,
      stopLoss: null,
      takeProfit: null,
      reasons: [reason],
      evidence: [],
    };
  }
}

function lastValue(list: Array<{ value: number }> | undefined): number | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const v = list[list.length - 1]?.value;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
