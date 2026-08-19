import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketDataRegistry } from './providers/registry';
import type { Candle, DataSourceStatus, MarketDataSource, Quote } from './providers/market-data.types';

@Injectable()
export class MarketService {
  constructor(
    private prisma: PrismaService,
    private registry: MarketDataRegistry,
  ) {}

  async getSymbols() {
    return this.prisma.symbol.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  }

  /** 实时行情: 可映射标的走 TickFlow, 其余/失败自动降级 mock */
  async getQuotes(symbols?: string[] | string): Promise<Quote[]> {
    const requestedSymbols = this.normalizeSymbols(symbols);
    const where = requestedSymbols.length
      ? { code: { in: requestedSymbols }, isActive: true }
      : { isActive: true };
    const symbolList = await this.prisma.symbol.findMany({ where });
    return this.registry.getQuotes(symbolList.map((s) => s.code));
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    return this.registry.getCandles(symbol, interval, limit);
  }

  async getIndicators(symbol: string, interval: string, indicators: string[]) {
    const candles = await this.getCandles(symbol, interval, 200);
    const result: Record<string, any> = {};

    if (!indicators?.length || indicators.includes('sma')) {
      result.sma = this.computeSMA(candles, 20);
    }
    if (!indicators?.length || indicators.includes('ema')) {
      result.ema = this.computeEMA(candles, 20);
    }
    if (!indicators?.length || indicators.includes('rsi')) {
      result.rsi = this.computeRSI(candles, 14);
    }
    if (!indicators?.length || indicators.includes('macd')) {
      result.macd = this.computeMACD(candles);
    }
    if (!indicators?.length || indicators.includes('bb')) {
      result.bb = this.computeBB(candles, 20);
    }

    return result;
  }

  /** 数据源状态: 当前主源、是否真实可用、每个标的实际走哪个源 */
  async getDataSourceStatus(): Promise<DataSourceStatus> {
    const status = this.registry.getStatus();
    const symbolList = await this.prisma.symbol.findMany({ where: { isActive: true } });
    const sourceBySymbol: Record<string, MarketDataSource> = {};
    for (const s of symbolList) sourceBySymbol[s.code] = this.registry.sourceFor(s.code);
    return { ...status, sourceBySymbol };
  }

  private normalizeSymbols(symbols?: string[] | string): string[] {
    return (Array.isArray(symbols) ? symbols : symbols ? [symbols] : [])
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private computeSMA(candles: any[], period: number) {
    const result: { time: number; value: number }[] = [];
    for (let i = period - 1; i < candles.length; i++) {
      const sum = candles.slice(i - period + 1, i + 1).reduce((a: number, c: any) => a + c.close, 0);
      result.push({ time: candles[i].time, value: Math.round((sum / period) * 100) / 100 });
    }
    return result;
  }

  private computeEMA(candles: any[], period: number) {
    const multiplier = 2 / (period + 1);
    const result: { time: number; value: number }[] = [];
    let ema = candles.slice(0, period).reduce((a: number, c: any) => a + c.close, 0) / period;
    for (let i = period - 1; i < candles.length; i++) {
      ema = (candles[i].close - ema) * multiplier + ema;
      result.push({ time: candles[i].time, value: Math.round(ema * 100) / 100 });
    }
    return result;
  }

  private computeRSI(candles: any[], period: number) {
    const result: { time: number; value: number }[] = [];
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      gains += Math.max(diff, 0);
      losses += Math.max(-diff, 0);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    result.push({ time: candles[period].time, value: this.rsiValue(avgGain, avgLoss) });
    for (let i = period + 1; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
      result.push({ time: candles[i].time, value: this.rsiValue(avgGain, avgLoss) });
    }
    return result;
  }

  private rsiValue(avgGain: number, avgLoss: number) {
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
  }

  private computeMACD(candles: any[]) {
    const ema12 = this.computeEMA(candles, 12);
    const ema26 = this.computeEMA(candles, 26);
    const macdLine = ema12.slice(-ema26.length).map((e, i) => ({
      time: e.time,
      value: Math.round((e.value - ema26[i].value) * 100) / 100,
    }));
    const signal = this.computeEMABasic(macdLine, 9);
    const histogram = macdLine.slice(-signal.length).map((m, i) => ({
      time: m.time,
      value: Math.round((m.value - signal[i].value) * 100) / 100,
    }));
    return { macdLine: macdLine.slice(-50), signal: signal.slice(-50), histogram: histogram.slice(-50) };
  }

  private computeEMABasic(values: { time: number; value: number }[], period: number) {
    const multiplier = 2 / (period + 1);
    const result: { time: number; value: number }[] = [];
    let ema = values.slice(0, period).reduce((a: number, v: any) => a + v.value, 0) / period;
    for (let i = period - 1; i < values.length; i++) {
      ema = (values[i].value - ema) * multiplier + ema;
      result.push({ time: values[i].time, value: Math.round(ema * 100) / 100 });
    }
    return result;
  }

  private computeBB(candles: any[], period: number) {
    const result: { time: number; upper: number; middle: number; lower: number }[] = [];
    for (let i = period - 1; i < candles.length; i++) {
      const slice = candles.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a: number, c: any) => a + c.close, 0) / period;
      const variance = slice.reduce((a: number, c: any) => a + (c.close - mean) ** 2, 0) / period;
      const std = Math.sqrt(variance);
      result.push({
        time: candles[i].time,
        upper: Math.round((mean + 2 * std) * 100) / 100,
        middle: Math.round(mean * 100) / 100,
        lower: Math.round((mean - 2 * std) * 100) / 100,
      });
    }
    return result;
  }
}

