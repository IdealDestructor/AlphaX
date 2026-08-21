import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';

/**
 * 概率带预测。
 *
 * 真实化进度（2026-08-21）：不再 Math.random 编造。
 * - pUp/pDown/median/band 基于真实日K（ATR 波动率 + RSI/EMA 方向偏置）确定性计算
 * - 置信度由数据完整度决定（蜡烛数量），而不是随机数
 * - 真实 AI 概率模型（如 quantile 回归 / P2 apps/ai）接入前，此为「基于真实行情的规则估算」
 */
@Injectable()
export class ForecastService {
  constructor(
    private prisma: PrismaService,
    private market: MarketService,
  ) {}

  async getForecast(symbol: string, horizon: string = '1w') {
    const sym = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!sym) return null;

    const existing = await this.prisma.forecast.findFirst({
      where: { symbolId: sym.id, horizon },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return this.formatForecast(existing, symbol);
    }

    return this.generateAndSave(sym, symbol, horizon);
  }

  async getForecasts(symbol?: string) {
    const where: any = {};
    if (symbol) {
      const sym = await this.prisma.symbol.findUnique({ where: { code: symbol } });
      if (sym) where.symbolId = sym.id;
    }
    const forecasts = await this.prisma.forecast.findMany({
      where,
      include: { symbol: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return forecasts.map((f) => ({
      id: f.id,
      symbol: f.symbol.code,
      horizon: f.horizon,
      pUp: f.pUp?.toNumber(),
      pDown: f.pDown?.toNumber(),
      pRange: f.pRange?.toNumber(),
      medianPrice: f.medianPrice?.toNumber(),
      lowBound: f.lowBound?.toNumber(),
      highBound: f.highBound?.toNumber(),
      confidence: f.confidence?.toNumber(),
      createdAt: f.createdAt.toISOString(),
    }));
  }

  private formatForecast(f: any, symbol: string) {
    return {
      symbol,
      horizon: f.horizon,
      pUp: f.pUp?.toNumber(),
      pDown: f.pDown?.toNumber(),
      pRange: f.pRange?.toNumber(),
      medianPrice: f.medianPrice?.toNumber(),
      lowBound: f.lowBound?.toNumber(),
      highBound: f.highBound?.toNumber(),
      confidence: f.confidence?.toNumber(),
      createdAt: f.createdAt.toISOString(),
    };
  }

  private async generateAndSave(sym: any, symbol: string, horizon: string) {
    const candles = await this.market.getCandles(symbol, '1d', 120);
    const stats = this.computeStats(candles);

    const horizonDays: Record<string, number> = { '1d': 1, '1w': 5, '1m': 21, '3m': 63 };
    const days = horizonDays[horizon] ?? 5;
    const volFrac = Math.min(0.5, stats.atrFrac * Math.sqrt(days));

    // 方向偏置：EMA 相对价格 + RSI 极端 → [-1, 1]
    const bias = this.clamp((stats.ema20 - stats.lastClose) / stats.lastClose * 50 + (stats.rsi - 50) / 50 * 0.5, -1, 1);
    const pUp = this.round4(this.clamp(0.5 + bias * 0.3, 0.12, 0.88));
    const pDown = this.round4(this.clamp(0.5 - bias * 0.3, 0.12, 0.88));
    const pRange = this.round4(this.clamp(1 - Math.abs(pUp - pDown), 0.05, 1));
    const median = Math.round(stats.lastClose * (1 + bias * volFrac * 0.5) * 100) / 100;
    const halfRange = Math.round(stats.lastClose * volFrac * 0.8 * 100) / 100;
    // 置信度：数据完整度决定，不再随机
    const confidence = this.round4(0.45 + Math.min(candles.length, 120) / 120 * 0.3);

    const saved = await this.prisma.forecast.create({
      data: {
        symbolId: sym.id,
        horizon,
        pUp,
        pDown,
        pRange,
        medianPrice: median,
        lowBound: Math.round((median - halfRange) * 100) / 100,
        highBound: Math.round((median + halfRange) * 100) / 100,
        confidence,
      },
    });

    return this.formatForecast(saved, symbol);
  }

  /** 从真实 K 线计算 ATR(14)/RSI(14)/EMA(20)/lastClose。 */
  private computeStats(candles: { open: number; high: number; low: number; close: number }[]) {
    if (candles.length === 0) {
      return { atrFrac: 0.02, rsi: 50, ema20: 0, lastClose: 100 };
    }
    const lastClose = candles[candles.length - 1]!.close;

    // ATR(14)
    const trs: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i]!;
      const prev = candles[i - 1]!;
      trs.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
    }
    const atrWindow = trs.slice(-14);
    const atr = atrWindow.length
      ? atrWindow.reduce((a, b) => a + b, 0) / atrWindow.length
      : lastClose * 0.01;
    const atrFrac = lastClose > 0 ? atr / lastClose : 0.01;

    // RSI(14)
    const rsi = this.computeRsi(candles, 14);

    // EMA(20)
    const ema20 = this.computeEma(candles, 20);

    return { atrFrac, rsi, ema20, lastClose };
  }

  private computeRsi(candles: { close: number }[], period: number): number {
    if (candles.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = candles[i]!.close - candles[i - 1]!.close;
      gains += Math.max(diff, 0);
      losses += Math.max(-diff, 0);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period + 1; i < candles.length; i++) {
      const diff = candles[i]!.close - candles[i - 1]!.close;
      avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    }
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
  }

  private computeEma(candles: { close: number }[], period: number): number {
    if (candles.length < period) return candles[candles.length - 1]!.close;
    const k = 2 / (period + 1);
    let ema = candles.slice(0, period).reduce((a, c) => a + c.close, 0) / period;
    for (let i = period; i < candles.length; i++) {
      ema = (candles[i]!.close - ema) * k + ema;
    }
    return ema;
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  private round4(v: number): number {
    return Math.round(v * 10000) / 10000;
  }
}
