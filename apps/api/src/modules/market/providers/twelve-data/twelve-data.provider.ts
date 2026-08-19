import type { Candle, MarketDataProvider, MarketDataSource, Quote } from '../market-data.types';

/**
 * TwelveData 行情数据源 (https://twelvedata.com/docs)。
 * 覆盖外汇/金属 (XAU/USD, XAG/USD) 等 AlphaX 需要但 TickFlow 不覆盖的品种。
 * 免费 Key: 800 credits/天, 8 req/min (https://twelvedata.com/pricing)。
 *   GET /price?symbol=XAU/USD&apikey=KEY          实时价 → { price: "2350.12" }
 *   GET /quote?symbol=XAU/USD&apikey=KEY          报价 (open/high/low/close/change/percent_change)
 *   GET /time_series?symbol=XAU/USD&interval=1min&outputsize=500&apikey=KEY   K线
 * AlphaX 代码 → TwelveData symbol: XAUUSD→XAU/USD, XAGUSD→XAG/USD
 * 未配置 TWELVEDATA_API_KEY 时 createIfConfigured() 返回 null, 自动走 mock。
 */

const DEFAULT_BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_TIMEOUT_MS = 10_000;

/** AlphaX 代码 → TwelveData symbol */
const SYMBOL_MAP: Record<string, string> = {
  XAUUSD: 'XAU/USD',
  XAGUSD: 'XAG/USD',
};

/** AlphaX 周期 → TwelveData interval */
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '4h': '4h',
  '1d': '1day',
  '1w': '1week',
  '1M': '1month',
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

/** datetime 字符串 → Unix 秒 (兼容 "2024-01-02" 与 "2024-01-02 15:30:00") */
function parseDatetime(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.floor(parsed / 1000);
}

export class TwelveDataProvider implements MarketDataProvider {
  readonly name: MarketDataSource = 'twelve-data';

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly enabled: boolean;

  private constructor() {
    this.apiKey = (process.env.TWELVEDATA_API_KEY ?? '').trim();
    this.baseUrl = (process.env.TWELVEDATA_BASE_URL ?? DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
    this.timeoutMs = Number(process.env.TWELVEDATA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    this.enabled = (process.env.TWELVEDATA_ENABLED ?? 'true').toLowerCase() !== 'false';
  }

  /** 配置了有效 Key 且未显式禁用时创建实例; 否则返回 null (走 mock) */
  static createIfConfigured(): TwelveDataProvider | null {
    const key = (process.env.TWELVEDATA_API_KEY ?? '').trim();
    if (!key || key.startsWith('td_placeholder')) return null;
    const enabled = (process.env.TWELVEDATA_ENABLED ?? 'true').toLowerCase() !== 'false';
    return enabled ? new TwelveDataProvider() : null;
  }

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  canResolve(symbol: string): boolean {
    return resolveTwelveDataSymbol(symbol) !== null;
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('apikey', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`TwelveData ${path} → HTTP ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`TwelveData ${path} → timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const pairs = symbols
      .map((s) => ({ alpha: s, td: resolveTwelveDataSymbol(s) }))
      .filter((p): p is { alpha: string; td: string } => p.td !== null);
    if (pairs.length === 0) return [];

    const quotes: Quote[] = [];
    for (const p of pairs) {
      const data = await this.request<unknown>('/quote', { symbol: p.td });
      quotes.push(toQuote(data, p.alpha));
    }
    return quotes;
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    const tdSymbol = resolveTwelveDataSymbol(symbol);
    if (!tdSymbol) return [];
    const tdInterval = INTERVAL_MAP[interval] ?? '1day';
    const data = await this.request<unknown>('/time_series', {
      symbol: tdSymbol,
      interval: tdInterval,
      outputsize: String(Math.min(Math.max(limit, 1), 5000)),
    });
    const candles = normalizeCandles(data);
    if (candles.length === 0) {
      throw new Error(`TwelveData /time_series → no data for ${tdSymbol} ${tdInterval}`);
    }
    return candles.slice(-limit);
  }
}

/** AlphaX 代码 → TwelveData symbol; 无法解析返回 null */
export function resolveTwelveDataSymbol(code: string): string | null {
  const trimmed = (code ?? '').trim();
  if (!trimmed) return null;
  return SYMBOL_MAP[trimmed.toUpperCase()] ?? null;
}

/** /quote → Quote */
function toQuote(raw: unknown, alphaSymbol: string): Quote {
  if (!isRecord(raw)) throw new Error('TwelveData /quote 返回结构异常');
  const close = num(raw.close) ?? 0;
  const change = num(raw.change) ?? 0;
  const changePercent = num(raw.percent_change) ?? 0;
  const datetime = typeof raw.datetime === 'string' ? raw.datetime : new Date().toISOString();
  return {
    symbol: alphaSymbol,
    price: round2(close),
    change: round2(change),
    changePercent: round2(changePercent),
    high: round2(num(raw.high) ?? close),
    low: round2(num(raw.low) ?? close),
    open: round2(num(raw.open) ?? close),
    close: round2(close),
    volume: Math.round(num(raw.volume) ?? 0),
    timestamp: new Date(datetime).toISOString(),
    source: 'twelve-data',
  };
}

/** /time_series → Candle[] */
export function normalizeCandles(raw: unknown): Candle[] {
  if (!isRecord(raw)) return [];
  const values = raw.values;
  if (!Array.isArray(values)) return [];

  const candles: Candle[] = [];
  for (const item of values) {
    if (!isRecord(item)) continue;
    const time = parseDatetime(item.datetime);
    const open = num(item.open);
    const high = num(item.high);
    const low = num(item.low);
    const close = num(item.close);
    if (time === undefined || open === undefined || high === undefined || low === undefined || close === undefined) {
      continue;
    }
    candles.push({
      time,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume: round2(num(item.volume) ?? 0),
    });
  }
  // values 按时间倒序返回 (最新在前), 翻转为正序
  return candles.reverse();
}


