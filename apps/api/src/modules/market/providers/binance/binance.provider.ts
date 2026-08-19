import type { Candle, MarketDataProvider, MarketDataSource, Quote } from '../market-data.types';

/**
 * Binance 公开行情数据源 (https://developers.binance.com/docs/binance-spot-api-docs)。
 * 加密资产现货公开行情, 无需 API Key (公开行情端点)。
 *   GET /api/v3/ticker/24hr?symbol=BTCUSDT   24h 实时行情
 *   GET /api/v3/klines?symbol=BTCUSDT&interval=1h&limit=500   K线 (二维数组)
 *   WS  wss://data-stream.binance.vision/ws/btcusdt@kline_1m   (P2 实时推送时接入)
 *
 * 注意: 部分网络环境下 api.binance.com 不可达, 可通过 BINANCE_BASE_URL 覆盖为
 * 公开行情镜像 https://data-api.binance.vision (同一套公开端点, 免登录)。
 *
 * AlphaX 代码 → Binance 现货交易对: BTCUSD→BTCUSDT, ETHUSD→ETHUSDT ...
 */

const DEFAULT_BASE_URL = 'https://api.binance.com';
const DEFAULT_TIMEOUT_MS = 10_000;

/** AlphaX 加密代码 → Binance 现货交易对 */
const CRYPTO_MAP: Record<string, string> = {
  BTCUSD: 'BTCUSDT',
  ETHUSD: 'ETHUSDT',
  SOLUSD: 'SOLUSDT',
  BNBUSD: 'BNBUSDT',
  XRPUSD: 'XRPUSDT',
};

/** AlphaX 周期 → Binance 周期 (键名一致, 仅兜底) */
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
  '1M': '1M',
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export class BinanceProvider implements MarketDataProvider {
  readonly name: MarketDataSource = 'binance';

  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly enabled: boolean;

  private constructor() {
    this.baseUrl = (process.env.BINANCE_BASE_URL ?? DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
    this.timeoutMs = Number(process.env.BINANCE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    this.enabled = (process.env.BINANCE_ENABLED ?? 'true').toLowerCase() !== 'false';
  }

  /** 公开行情无需 Key, 默认始终启用; 可通过 BINANCE_ENABLED=false 关闭 */
  static createIfEnabled(): BinanceProvider | null {
    return (process.env.BINANCE_ENABLED ?? 'true').toLowerCase() !== 'false'
      ? new BinanceProvider()
      : null;
  }

  get configured(): boolean {
    return true; // 免 Key
  }

  canResolve(symbol: string): boolean {
    return resolveBinanceSymbol(symbol) !== null;
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Binance ${path} → HTTP ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Binance ${path} → timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const pairs = symbols
      .map((s) => ({ alpha: s, bn: resolveBinanceSymbol(s) }))
      .filter((p): p is { alpha: string; bn: string } => p.bn !== null);
    if (pairs.length === 0) return [];

    const quotes: Quote[] = [];
    for (const p of pairs) {
      const data = await this.request<unknown>('/api/v3/ticker/24hr', { symbol: p.bn });
      quotes.push(toQuote(data, p.alpha));
    }
    return quotes;
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    const bnSymbol = resolveBinanceSymbol(symbol);
    if (!bnSymbol) return [];
    const bnInterval = INTERVAL_MAP[interval] ?? '1h';
    const data = await this.request<unknown>('/api/v3/klines', {
      symbol: bnSymbol,
      interval: bnInterval,
      limit: String(Math.min(Math.max(limit, 1), 1000)),
    });
    const candles = normalizeKlines(data);
    if (candles.length === 0) {
      throw new Error(`Binance /klines → no data for ${bnSymbol} ${bnInterval}`);
    }
    return candles.slice(-limit);
  }
}

/** AlphaX 加密代码 → Binance 现货交易对; 无法解析返回 null */
export function resolveBinanceSymbol(code: string): string | null {
  const trimmed = (code ?? '').trim();
  if (!trimmed) return null;
  return CRYPTO_MAP[trimmed.toUpperCase()] ?? null;
}

/** ticker/24hr → Quote */
function toQuote(raw: unknown, alphaSymbol: string): Quote {
  if (!isRecord(raw)) throw new Error('Binance ticker/24hr 返回结构异常');
  const price = num(raw.lastPrice) ?? 0;
  const change = num(raw.priceChange) ?? 0;
  const changePercent = num(raw.priceChangePercent) ?? 0;
  const closeTime = num(raw.closeTime) ?? Date.now();
  return {
    symbol: alphaSymbol,
    price: round2(price),
    change: round2(change),
    changePercent: round2(changePercent),
    high: round2(num(raw.highPrice) ?? price),
    low: round2(num(raw.lowPrice) ?? price),
    open: round2(num(raw.openPrice) ?? price),
    close: round2(num(raw.prevClosePrice) ?? price),
    volume: round2(num(raw.volume) ?? 0),
    timestamp: new Date(closeTime).toISOString(),
    source: 'binance',
  };
}

/** klines 二维数组 → Candle[] (openTime 为毫秒) */
export function normalizeKlines(raw: unknown): Candle[] {
  if (!Array.isArray(raw)) return [];
  const candles: Candle[] = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const openTime = num(row[0]);
    const open = num(row[1]);
    const high = num(row[2]);
    const low = num(row[3]);
    const close = num(row[4]);
    const volume = num(row[5]);
    if (openTime === undefined || open === undefined || high === undefined || low === undefined || close === undefined) {
      continue;
    }
    candles.push({
      time: Math.floor(openTime / 1000),
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume: round2(volume ?? 0),
    });
  }
  return candles;
}



