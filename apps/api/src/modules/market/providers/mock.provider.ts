import type { Candle, MarketDataProvider, MarketDataSource, Quote } from './market-data.types';

/**
 * 内置模拟行情 Provider。
 * 在未配置数据源 / 真实数据源不可用 / 标的无映射时兜底, 保证前端始终有数据可展示。
 * 所有返回均带 source: 'mock', 前端可据此展示"模拟数据"标识。
 */
export class MockProvider implements MarketDataProvider {
  readonly name: MarketDataSource = 'mock';

  canResolve(_symbol: string): boolean {
    return true; // mock 可以解析任意代码
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return symbols.map((code) => this.generateQuote(code));
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    const now = Date.now();
    const msPerCandle = this.intervalToMs(interval);
    const candles: Candle[] = [];

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

  private generateQuote(code: string): Quote {
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
      source: 'mock',
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
}
