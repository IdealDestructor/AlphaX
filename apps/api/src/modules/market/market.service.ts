import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketService {
  constructor(private prisma: PrismaService) {}

  async getSymbols() {
    return this.prisma.symbol.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  }

  async getQuotes(symbols?: string[] | string) {
    const requestedSymbols = (Array.isArray(symbols) ? symbols : symbols ? [symbols] : [])
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter(Boolean);
    const where = requestedSymbols.length
      ? { code: { in: requestedSymbols }, isActive: true }
      : { isActive: true };
    const symbolList = await this.prisma.symbol.findMany({ where });
    return symbolList.map((s) => this.generateQuote(s.code));
  }

  async getCandles(symbol: string, interval: string, limit: number) {
    const now = Date.now();
    const msPerCandle = this.intervalToMs(interval);
    const candles: any[] = [];

    for (let i = limit - 1; i >= 0; i--) {
      const ts = Math.floor((now - i * msPerCandle) / msPerCandle) * msPerCandle;
      const base = 2300 + Math.sin(ts / 3600000) * 50 + Math.random() * 10;
      const open = base;
      const close = base + (Math.random() - 0.5) * 20;
      const high = Math.max(open, close) + Math.random() * 10;
      const low = Math.min(open, close) - Math.random() * 10;
      candles.push({
        time: ts / 1000,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.round(Math.random() * 10000 + 1000),
      });
    }
    return candles;
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

  private generateQuote(code: string) {
    const basePrice = this.basePrice(code);
    const change = (Math.random() - 0.5) * 0.04;
    const price = basePrice * (1 + change);
    const open = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    return {
      symbol: code,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 10000) / 100,
      changePercent: Math.round((change / (1 + change)) * 10000) / 100,
      high: Math.round(price * 1.005 * 100) / 100,
      low: Math.round(price * 0.995 * 100) / 100,
      open: Math.round(open * 100) / 100,
      close: Math.round(price * 100) / 100,
      volume: Math.round(Math.random() * 100000 + 5000),
      timestamp: new Date().toISOString(),
    };
  }

  private basePrice(code: string): number {
    const prices: Record<string, number> = {
      XAUUSD: 2350, XAGUSD: 28.5, BTCUSD: 67000, DXY: 104.5,
      NAS100: 19750, SPX500: 5400, WTI: 78, BRENT: 82,
      GLD: 215, SLV: 25, SPY: 540, US10Y: 4.25,
    };
    return prices[code] || 100;
  }

  private intervalToMs(interval: string): number {
    const map: Record<string, number> = {
      '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000,
      '1h': 3600000, '4h': 14400000, '1d': 86400000, '1w': 604800000,
    };
    return map[interval] || 3600000;
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
