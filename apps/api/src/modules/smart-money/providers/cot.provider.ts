import { Injectable, Logger } from '@nestjs/common';

/**
 * CFTC COT（Commitments of Traders）真实数据 Provider。
 *
 * 数据源：CFTC 官方每周发布的「Disaggregated Futures」报告（免费、无 Key）。
 *   https://www.cftc.gov/dea/newcot/disaggregated_futures.txt
 * 解析：固定宽度文本 → 按表头定位 Money Manager 长/空仓列，匹配 COMEX Gold/Silver。
 * 说明：报告每周五发布（周三数据）；本环境无外网无法实测，任何解析/网络失败都会
 *       由调用方降级到确定性估算（sources 标注 'mock'），绝不编造数值。
 */

export interface CotPosition {
  symbol: string; // AlphaX 代码
  reportDate: string; // ISO
  specLong: number;
  specShort: number;
  netSpecLong: number;
}

export interface CotSnapshot {
  asOf: string;
  reportDate: string | null;
  items: CotPosition[];
}

const DEFAULT_URLS = [
  'https://www.cftc.gov/dea/newcot/disaggregated_futures.txt',
  'https://www.cftc.gov/files/dea/newcot/disaggregated_futures.txt',
];

/** AlphaX 代码 → CFTC 市场名关键词 + 市场代码 */
const MARKET_MATCH: Array<{ symbol: string; name: string; code: string }> = [
  { symbol: 'XAUUSD', name: 'GOLD', code: '088691' },
  { symbol: 'XAGUSD', name: 'SILVER', code: '090691' },
];

const TTL_MS = 6 * 60 * 60 * 1000; // COT 周频，缓存 6h

@Injectable()
export class CotProvider {
  private readonly logger = new Logger(CotProvider.name);
  private cache: CotSnapshot | null = null;
  private cacheExpiresAt = 0;

  async getSnapshot(): Promise<CotSnapshot | null> {
    if (this.cache && this.cacheExpiresAt > Date.now()) return this.cache;

    const urls = (process.env.CFTC_COT_URL ? [process.env.CFTC_COT_URL] : DEFAULT_URLS);
    for (const url of urls) {
      try {
        const text = await this.fetchText(url);
        const items = parseCftcDisaggregated(text);
        if (items.length === 0) {
          this.logger.warn(`CFTC ${url} 解析后无 Gold/Silver 数据`);
          continue;
        }
        const snapshot: CotSnapshot = {
          asOf: new Date().toISOString(),
          reportDate: items[0]?.reportDate ?? null,
          items,
        };
        this.cache = snapshot;
        this.cacheExpiresAt = Date.now() + TTL_MS;
        this.logger.log(`CFTC COT 拉取成功: ${items.length} 个标的 (reportDate=${snapshot.reportDate})`);
        return snapshot;
      } catch (err) {
        this.logger.warn(`CFTC ${url} 拉取失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return null;
  }

  private async fetchText(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AlphaX/0.1 (+https://alphax.local)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }
}

/** 解析 CFTC disaggregated 固定宽度文本，返回 Gold/Silver 的 Money Manager 持仓。 */
export function parseCftcDisaggregated(text: string): CotPosition[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\r$/, ''));
  // 表头行：含 CFTC_Contract_Market_Name
  const headerIdx = lines.findIndex((l) => l.includes('CFTC_Contract_Market_Name'));
  if (headerIdx < 0) return [];

  const header = lines[headerIdx] ?? '';
  const cols = buildColumns(header);

  const nameRange = cols['CFTC_Contract_Market_Name'];
  const codeRange = cols['CFTC_Market_Code'];
  const hedgeRange = cols['CFTC_Contract_Hedge_Category'];
  const longRange = cols['M_MONEY_LONG'] ?? cols['M_MONEY_LONG_ALL'] ?? cols['NonComm_Long'] ?? cols['NonComm_Positions_Long_All'];
  const shortRange = cols['M_MONEY_SHORT'] ?? cols['M_MONEY_SHORT_ALL'] ?? cols['NonComm_Short'] ?? cols['NonComm_Positions_Short_All'];
  if (!nameRange || !codeRange || !longRange || !shortRange) {
    // 列名不确定时返回空，调用方降级（绝不猜错列）
    return [];
  }

  const out: CotPosition[] = [];
  for (const line of lines.slice(headerIdx + 1)) {
    if (!line.trim()) continue;
    const marketName = slice(line, nameRange).trim().toUpperCase();
    const code = slice(line, codeRange).trim();
    const hedge = hedgeRange ? slice(line, hedgeRange).trim() : 'FUT';

    // 只取期货（FUT），不混期权
    if (hedge.toUpperCase() !== 'FUT') continue;

    const match = MARKET_MATCH.find((m) => marketName.includes(m.name) && (!m.code || code === m.code || code.startsWith(m.code)));
    if (!match) continue;

    const specLong = parseNum(slice(line, longRange));
    const specShort = parseNum(slice(line, shortRange));
    if (specLong == null || specShort == null) continue;

    const dateKey = Object.keys(cols).find((k) => k.startsWith('Report_Date'));
    const dateRange = dateKey ? cols[dateKey] : undefined;
    const dateRaw = dateRange ? slice(line, dateRange).trim() : '';
    out.push({
      symbol: match.symbol,
      reportDate: dateRaw ? new Date(dateRaw + 'T00:00:00Z').toISOString() : new Date().toISOString(),
      specLong,
      specShort,
      netSpecLong: specLong - specShort,
    });
  }
  return out;
}

function buildColumns(header: string): Record<string, [number, number]> {
  const cols: Record<string, [number, number]> = {};
  // 记录表头全部 token（名称以空格分隔的固定宽度布局），
  // 列宽 = 该 token 起点到下一个 token 起点，避免切片跨列。
  const re = /[A-Za-z0-9_]+/g;
  let m: RegExpExecArray | null;
  const tokens: Array<{ name: string; start: number }> = [];
  while ((m = re.exec(header)) !== null) {
    tokens.push({ name: m[0], start: m.index });
  }
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const nextStart = tokens[i + 1]?.start ?? header.length;
    cols[t.name] = [t.start, nextStart];
  }
  return cols;
}

function slice(line: string, range: [number, number]): string {
  const [s, e] = range;
  return line.slice(s, e);
}

function parseNum(v: string): number | null {
  const cleaned = v.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}


