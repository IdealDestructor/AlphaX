import type { Candle, MarketDataProvider, MarketDataSource, Quote } from '../market-data.types';

/**
 * US Treasury 官方每日收益率数据源 (https://home.treasury.gov/resource-center/data-chart-center/interest-rates)。
 * 美国政府公开数据, 免 Key (S 级可商用)。端点返回 CSV:
 *   GET https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/{year}/all
 *       ?type=daily_treasury_yield_curve&field_tdr_date_value={year}&page&_format=csv
 * 列: Date, 1 Mo, 2 Mo, 3 Mo, 6 Mo, 1 Yr, 2 Yr, 3 Yr, 5 Yr, 7 Yr, 10 Yr, 20 Yr, 30 Yr
 * (参考 financial-Research global-stock-data, 实测 10Y=4.71)
 *
 * 语义: 收益率品种以「收益率百分比」作为 price (4.71 = 4.71%);
 * change/changePercent 按相邻交易日差值计算。仅支持日线及以上级别;
 * 分钟级无法从该源获取, 返回空并由 registry 回退 mock。
 *
 * AlphaX 代码 → CSV 列名: US10Y→"10 Yr", US2Y→"2 Yr", US30Y→"30 Yr", US5Y→"5 Yr"
 */

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_YEARS_BACK = 5;

/** AlphaX 债券代码 → Treasury CSV 列名 */
const YIELD_MAP: Record<string, string> = {
  US10Y: '10 Yr',
  US2Y: '2 Yr',
  US30Y: '30 Yr',
  US5Y: '5 Yr',
  US3M: '3 Mo',
};

/** AlphaX 周期 → 聚合方式 (仅日线及以上) */
const DAILY_INTERVALS = new Set(['1d', '1w', '1M']);

export class TreasuryProvider implements MarketDataProvider {
  readonly name: MarketDataSource = 'treasury';

  private readonly timeoutMs: number;
  private readonly enabled: boolean;

  private constructor() {
    this.timeoutMs = Number(process.env.TREASURY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    this.enabled = (process.env.TREASURY_ENABLED ?? 'true').toLowerCase() !== 'false';
  }

  /** 免 Key 官方数据, 默认启用; 可通过 TREASURY_ENABLED=false 关闭 */
  static createIfEnabled(): TreasuryProvider | null {
    return (process.env.TREASURY_ENABLED ?? 'true').toLowerCase() !== 'false'
      ? new TreasuryProvider()
      : null;
  }

  get configured(): boolean {
    return true; // 免 Key
  }

  canResolve(symbol: string): boolean {
    return resolveTreasuryColumn(symbol) !== null;
  }

  private async fetchCsv(year: number): Promise<string> {
    const url =
      `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/` +
      `daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve` +
      `&field_tdr_date_value=${year}&page&_format=csv`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Treasury ${year} → HTTP ${res.status} ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Treasury ${year} → timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /** 拉取近若干年 CSV 并解析为 { date, value } 序列 (日期倒序: 最新在前) */
  private async fetchYieldSeries(column: string): Promise<{ date: string; value: number }[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const rows: { date: string; value: number }[] = [];
    let lastErr: unknown = null;

    for (let back = 0; back < MAX_YEARS_BACK; back++) {
      const year = currentYear - back;
      try {
        const csv = await this.fetchCsv(year);
        const parsed = parseTreasuryCsv(csv, column);
        rows.push(...parsed);
        if (parsed.length > 0) return rows; // 当年有数据即返回
      } catch (err) {
        lastErr = err;
      }
    }
    if (rows.length === 0) {
      throw lastErr instanceof Error ? lastErr : new Error('Treasury 无可用数据');
    }
    return rows;
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const targets = symbols
      .map((s) => ({ alpha: s, column: resolveTreasuryColumn(s) }))
      .filter((t): t is { alpha: string; column: string } => t.column !== null);
    if (targets.length === 0) return [];

    const quotes: Quote[] = [];
    for (const t of targets) {
      const series = await this.fetchYieldSeries(t.column);
      const current = series[0];
      const prev = series[1] ?? current;
      const change = prev ? current.value - prev.value : 0;
      quotes.push({
        symbol: t.alpha,
        price: round2(current.value),
        change: round2(change),
        changePercent: round2(prev.value !== 0 ? (change / prev.value) * 100 : 0),
        high: round2(current.value),
        low: round2(current.value),
        open: round2(prev.value),
        close: round2(current.value),
        volume: 0,
        timestamp: new Date(`${current.date}T12:00:00Z`).toISOString(),
        source: 'treasury',
      });
    }
    return quotes;
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    const column = resolveTreasuryColumn(symbol);
    if (!column) return [];
    if (!DAILY_INTERVALS.has(interval)) return []; // 分钟级无真实数据, 交给 registry 降级

    const series = await this.fetchYieldSeries(column);
    // series 按日期倒序, 翻转成时间正序
    const ascending = series.slice().reverse();
    const daily = ascending.map((r) => ({
      time: Math.floor(new Date(`${r.date}T12:00:00Z`).getTime() / 1000),
      value: r.value,
    }));
    const candles = aggregateDaily(interval, daily);
    if (candles.length === 0) {
      throw new Error(`Treasury → no data for ${symbol} ${interval}`);
    }
    return candles.slice(-limit);
  }
}

/** AlphaX 债券代码 → Treasury 列名; 无法解析返回 null */
export function resolveTreasuryColumn(code: string): string | null {
  const trimmed = (code ?? '').trim();
  if (!trimmed) return null;
  return YIELD_MAP[trimmed.toUpperCase()] ?? null;
}

/** 解析 Treasury CSV (表头含 "Date" 与目标列名), 返回按日期倒序的序列 */
export function parseTreasuryCsv(csv: string, column: string): { date: string; value: number }[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const dateIdx = header.findIndex((h) => h.toLowerCase() === 'date');
  const colIdx = header.findIndex((h) => h.toLowerCase() === column.toLowerCase());
  if (dateIdx < 0 || colIdx < 0) return [];

  const rows: { date: string; value: number }[] = [];
  for (const line of lines.slice(1)) {
    // CSV 可能存在引号包裹/逗号内嵌, 用简单 CSV 解析
    const fields = splitCsvLine(line);
    const date = fields[dateIdx]?.trim();
    const raw = fields[colIdx]?.trim();
    if (!date || raw === '' || raw === 'N/A') continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    rows.push({ date, value });
  }
  // CSV 按日期倒序 (最新在前), 保持原序即可
  return rows;
}

/** 简单 CSV 行解析 (支持双引号包裹) */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** 把日线收益率聚合为 1w / 1M (1d 原样返回) */
export function aggregateDaily(interval: string, daily: { time: number; value: number }[]): Candle[] {
  if (interval === '1d') {
    return daily.map((d) => ({
      time: d.time,
      open: round2(d.value),
      high: round2(d.value),
      low: round2(d.value),
      close: round2(d.value),
      volume: 0,
    }));
  }
  const groups = new Map<string, { time: number; values: number[] }>();
  for (const d of daily) {
    const key = interval === '1w' ? isoWeekKey(d.time) : isoMonthKey(d.time);
    const group = groups.get(key);
    if (group) {
      group.values.push(d.value);
    } else {
      groups.set(key, { time: d.time, values: [d.value] });
    }
  }
  const out: Candle[] = [];
  for (const g of groups.values()) {
    const open = g.values[0]!;
    const close = g.values[g.values.length - 1]!;
    out.push({
      time: g.time,
      open: round2(open),
      high: round2(Math.max(...g.values)),
      low: round2(Math.min(...g.values)),
      close: round2(close),
      volume: 0,
    });
  }
  return out;
}

function isoWeekKey(time: number): string {
  const d = new Date(time * 1000);
  const tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const week = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${tmp.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function isoMonthKey(time: number): string {
  const d = new Date(time * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}


function round2(n: number): number {
  return Math.round(n * 100) / 100;
}


