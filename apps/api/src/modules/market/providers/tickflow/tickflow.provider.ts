import type { Candle, MarketDataProvider, MarketDataSource, Quote } from '../market-data.types';
import { resolveTickflowSymbol } from './symbol-map';

/**
 * TickFlow 行情数据源 REST 适配器 (https://tickflow.org)。
 *
 * 接口约定 (来自官方 SDK / 文档, 未经本环境实时验证, 失败会自动回退 mock):
 *   GET /v1/quotes?symbols=A,B       实时行情 (标的较多时官方建议 POST /v1/quotes)
 *   GET /v1/klines?symbol=X&period=..&count=..   单标的 K 线
 *   GET /v1/klines/intraday?symbol=X&period=..   当日分钟 K 线 (兜底)
 * 鉴权: Authorization: Bearer <key> (同时附带 X-API-Key, 兼容两种服务端)
 * 百分比字段语义: 0.01 => 1% (TICKFLOW_PERCENT_SCALE 可配置)
 * 时间戳: 毫秒
 */

const DEFAULT_BASE_URL = 'https://api.tickflow.org';
const DEFAULT_TIMEOUT_MS = 10_000;

/** AlphaX 周期 → TickFlow 周期 */
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '60m',
  '4h': '240m',
  '1d': '1d',
  '1w': '1w',
  '1M': '1M',
};

const INTRADAY_INTERVALS = new Set(['1m', '5m', '15m', '30m', '60m', '240m']);

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

function pick(record: JsonRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 展开 API 返回, 取出数组主体 (支持裸数组或 {data}/{quotes}/{list}/{items}/{result} 包裹) */
function unwrapArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data)) {
    for (const key of ['data', 'quotes', 'list', 'items', 'result', 'results']) {
      const v = data[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

/** 取行情标的代码 (大小写归一) */
function extractSymbol(record: JsonRecord): string {
  const raw = pick(record, 'symbol', 'code', 'ticker', 'secid');
  return typeof raw === 'string' ? raw.toUpperCase() : '';
}

/** 百分比归一: 默认按文档 0.01 => 1% 缩放; 可通过 TICKFLOW_PERCENT_SCALE 覆盖 */
function normalizePercent(value: unknown, scale: number): number {
  const n = num(value);
  if (n === undefined) return 0;
  const scaled = n * scale;
  return round2(Math.max(-100, Math.min(100, scaled)));
}

/** 时间戳归一为 Unix 秒 (毫秒/秒/ISO 字符串均兼容) */
function normalizeTime(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const asNum = Number(value);
    if (Number.isFinite(asNum) && String(value).trim() === String(asNum)) {
      return asNum > 1e12 ? Math.floor(asNum / 1000) : Math.floor(asNum);
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  }
  return undefined;
}

/** 从 K 线记录里取数值字段 (兼容全名/缩写) */
function barNum(record: JsonRecord, ...keys: string[]): number | undefined {
  return num(pick(record, ...keys));
}

/** 归一化单根 K 线 */
function toCandle(record: JsonRecord): Candle | null {
  const time = normalizeTime(pick(record, 'time', 'timestamp', 'datetime', 'date', 't'));
  if (time === undefined) return null;
  const open = barNum(record, 'open', 'o');
  const high = barNum(record, 'high', 'h');
  const low = barNum(record, 'low', 'l');
  const close = barNum(record, 'close', 'c');
  const volume = barNum(record, 'volume', 'vol', 'v') ?? 0;
  if (close === undefined || open === undefined || high === undefined || low === undefined) return null;
  return {
    time,
    open: round2(open),
    high: round2(high),
    low: round2(low),
    close: round2(close),
    volume: Math.round(volume),
  };
}

/** 归一化 K 线响应: 支持 数组 / 列式对象 {time:[...], open:[...]} / {bars}/{data}/{klines} 包裹 */
function normalizeCandles(raw: unknown): Candle[] {
  const rows: unknown[] = [];
  if (Array.isArray(raw)) {
    rows.push(...raw);
  } else if (isRecord(raw)) {
    // 列式对象: 所有字段都是等长数组
    const keys = Object.keys(raw);
    const arrayKeys = keys.filter((k) => Array.isArray(raw[k]));
    if (arrayKeys.length >= 4) {
      const length = (raw[arrayKeys[0]] as unknown[]).length;
      for (let i = 0; i < length; i++) {
        const row: JsonRecord = {};
        for (const k of arrayKeys) row[k] = (raw[k] as unknown[])[i];
        rows.push(row);
      }
    } else {
      for (const key of ['bars', 'data', 'klines', 'items', 'candles', 'list', 'result']) {
        const v = raw[key];
        if (Array.isArray(v)) {
          rows.push(...v);
          break;
        }
      }
    }
  }
  const candles: Candle[] = [];
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const candle = toCandle(row);
    if (candle) candles.push(candle);
  }
  return candles;
}

/** 行情字段映射 (兼容 SDK 字段名) */
function toQuote(record: JsonRecord, alphaSymbol: string, tickflowSymbol: string, scale: number): Quote | null {
  const price = num(pick(record, 'last_price', 'price', 'last', 'latest'));
  if (price === undefined || price <= 0) return null;

  const prevClose =
    num(pick(record, 'prev_close', 'pre_close', 'previous_close')) ?? price;
  const change = num(pick(record, 'change', 'change_amount')) ?? round2(price - prevClose);
  const changePercent =
    normalizePercent(pick(record, 'change_percent', 'change_pct', 'pct_change'), scale) ??
    (prevClose > 0 ? round2((change / prevClose) * 100) : 0);

  const open = num(pick(record, 'open')) ?? prevClose;
  const high = num(pick(record, 'high')) ?? round2(price * 1.001);
  const low = num(pick(record, 'low')) ?? round2(price * 0.999);
  const volume = num(pick(record, 'volume', 'vol', 'turnover_volume')) ?? 0;
  const timestamp = normalizeTime(pick(record, 'timestamp', 'time', 'update_time', 'ts'));

  return {
    symbol: alphaSymbol,
    price: round2(price),
    change: round2(change),
    changePercent,
    high: round2(high),
    low: round2(low),
    open: round2(open),
    close: round2(prevClose),
    volume: Math.round(volume),
    timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
    source: 'tickflow',
  };
}

export class TickFlowProvider implements MarketDataProvider {
  readonly name: MarketDataSource = 'tickflow';

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly percentScale: number;
  private readonly enabled: boolean;

  private constructor() {
    this.apiKey = (process.env.TICKFLOW_API_KEY ?? '').trim();
    this.baseUrl = (process.env.TICKFLOW_BASE_URL ?? DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
    this.timeoutMs = Number(process.env.TICKFLOW_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    this.percentScale = Number(process.env.TICKFLOW_PERCENT_SCALE ?? 100) || 100;
    this.enabled = (process.env.TICKFLOW_ENABLED ?? 'true').toLowerCase() !== 'false';
  }

  /** 配置了有效 Key 且未显式禁用时创建实例; 否则返回 null (走 mock) */
  static createIfConfigured(): TickFlowProvider | null {
    const key = (process.env.TICKFLOW_API_KEY ?? '').trim();
    if (!key || key.startsWith('tk_placeholder')) return null;
    const enabled = (process.env.TICKFLOW_ENABLED ?? 'true').toLowerCase() !== 'false';
    return enabled ? new TickFlowProvider() : null;
  }

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  canResolve(symbol: string): boolean {
    return resolveTickflowSymbol(symbol) !== null;
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`TickFlow ${path} → HTTP ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`TickFlow ${path} → timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const pairs = symbols
      .map((s) => ({ alpha: s, tf: resolveTickflowSymbol(s) }))
      .filter((p): p is { alpha: string; tf: string } => p.tf !== null);
    if (pairs.length === 0) return [];

    const reverse = new Map(pairs.map((p) => [p.tf.toUpperCase(), p.alpha]));
    const tfCodes = [...new Set(pairs.map((p) => p.tf))];
    const data = await this.request<unknown>('/v1/quotes', { symbols: tfCodes.join(',') });
    const rows = unwrapArray(data);

    const quotes: Quote[] = [];
    for (const row of rows) {
      if (!isRecord(row)) continue;
      const tfSymbol = extractSymbol(row);
      const alpha = (tfSymbol ? reverse.get(tfSymbol.toUpperCase()) : undefined) ?? tfSymbol;
      const quote = toQuote(row, alpha || tfSymbol, tfSymbol, this.percentScale);
      if (quote) quotes.push(quote);
    }
    // 部分标的可能没返回, 补齐占位避免前端拿不到该代码
    for (const p of pairs) {
      if (!quotes.some((q) => q.symbol === p.alpha)) {
        quotes.push({
          symbol: p.alpha,
          price: 0,
          change: 0,
          changePercent: 0,
          high: 0,
          low: 0,
          open: 0,
          close: 0,
          volume: 0,
          timestamp: new Date().toISOString(),
          source: 'tickflow',
        });
      }
    }
    return quotes;
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    const tfSymbol = resolveTickflowSymbol(symbol);
    if (!tfSymbol) return [];
    const period = INTERVAL_MAP[interval] ?? '1d';
    const count = String(Math.min(Math.max(limit, 1), 1000));
    const params = { symbol: tfSymbol, period, count, adjust: 'none' };

    let candles = normalizeCandles(await this.request<unknown>('/v1/klines', params));
    // 分钟级历史可能未开通: 兜底尝试当日分钟接口
    if (candles.length === 0 && INTRADAY_INTERVALS.has(period)) {
      candles = normalizeCandles(await this.request<unknown>('/v1/klines/intraday', params));
    }
    if (candles.length === 0) {
      throw new Error(`TickFlow /v1/klines → no data for ${tfSymbol} ${period}`);
    }
    return candles.slice(-limit);
  }
}

