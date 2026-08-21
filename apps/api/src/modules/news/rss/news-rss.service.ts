import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { parseRssFeed, RssFeedItem } from './rss-xml.parser';

/**
 * 新闻 RSS Provider（收编 Google News / Kitco / CoinDesk / CNBC）。
 * - fetch 各源 → 零依赖 XML 解析 → 关键词映射标的 → upsert 到 news 表（source+externalId 幂等）
 * - 源挂了 / 解析失败只记录，不影响已有数据（产品原则：源挂了如实报缺，不填空）
 */

interface RssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  weight: number;
}

const DEFAULT_SOURCES: RssSource[] = [
  { id: 'google-gold', name: 'Google News', url: 'https://news.google.com/rss/search?q=gold+precious+metals+market&hl=en-US&gl=US&ceid=US:en', category: '贵金属', weight: 0.7 },
  { id: 'google-macro', name: 'Google News', url: 'https://news.google.com/rss/search?q=federal+reserve+inflation+economy+market&hl=en-US&gl=US&ceid=US:en', category: '宏观经济', weight: 0.7 },
  { id: 'google-crypto', name: 'Google News', url: 'https://news.google.com/rss/search?q=bitcoin+cryptocurrency+market&hl=en-US&gl=US&ceid=US:en', category: '数字货币', weight: 0.7 },
  { id: 'kitco', name: 'Kitco', url: 'https://www.kitco.com/news/rss/latest.xml', category: '贵金属', weight: 0.9 },
  { id: 'coindesk', name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: '数字货币', weight: 0.85 },
  { id: 'cnbc', name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', category: '宏观经济', weight: 0.8 },
];

const SYMBOL_KEYWORDS: Array<[string, string[]]> = [
  ['XAUUSD', ['gold', 'xau', 'xauusd', 'precious metal', 'bullion', 'spot gold', '黄金', '金价']],
  ['XAGUSD', ['silver', 'xag', 'xagusd', '白银']],
  ['BTCUSD', ['bitcoin', 'btc', 'cryptocurrency', '比特币']],
  ['DXY', ['dollar index', 'dxy', 'us dollar index', '美元指数']],
  ['NAS100', ['nasdaq', 'ixic', 'nasdaq 100', '纳斯达克']],
  ['SPX500', ['s&p 500', 'sp500', 'spx', '标普']],
  ['WTI', ['crude oil', 'wti', 'oil price', '原油']],
  ['BRENT', ['brent', 'brent crude']],
  ['GLD', ['gld', 'spdr gold']],
  ['SLV', ['slv', 'ishares silver']],
  ['SPY', ['spy', 'spdr s&p']],
  ['US10Y', ['treasury', 'bond yield', 'us10y', '10-year yield', '美债', '收益率']],
  ['VIX', ['vix', 'volatility index']],
];

const HIGH_IMPACT = ['fomc', 'federal reserve', 'interest rate', 'cpi', 'inflation', 'nonfarm', 'nfp', 'gdp', 'unemployment', 'central bank', 'ppi', 'payroll'];
const MEDIUM_IMPACT = ['pmi', 'manufacturing', 'retail sales', 'trade', 'tariff', 'sanction', 'durable goods'];

@Injectable()
export class NewsRssService {
  private readonly logger = new Logger(NewsRssService.name);

  constructor(private prisma: PrismaService) {}

  /** 同步所有配置源，返回统计（成功/失败/新写入）。 */
  async syncAll(): Promise<{ sources: number; items: number; created: number; updated: number; failed: string[]; fetchedAt: string }> {
    const sources = this.loadSources();
    const failed: string[] = [];
    let created = 0;
    let updated = 0;
    let items = 0;

    for (const source of sources) {
      try {
        const xml = await this.fetchFeed(source.url);
        const parsed = parseRssFeed(xml, source.name);
        items += parsed.length;
        const result = await this.ingest(source, parsed);
        created += result.created;
        updated += result.updated;
        this.logger.log(`${source.name}: ${parsed.length} 条, 新增 ${result.created}, 更新 ${result.updated}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failed.push(`${source.id}: ${message}`);
        this.logger.warn(`${source.name} 抓取失败: ${message}`);
      }
    }

    return { sources: sources.length, items, created, updated, failed, fetchedAt: new Date().toISOString() };
  }

  private loadSources(): RssSource[] {
    const raw = process.env.NEWS_RSS_SOURCES;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as RssSource[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        this.logger.warn('NEWS_RSS_SOURCES 不是合法 JSON，使用默认源');
      }
    }
    return DEFAULT_SOURCES;
  }

  private async fetchFeed(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
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

  private async ingest(source: RssSource, items: RssFeedItem[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;
    for (const item of items) {
      const text = `${item.title} ${item.summary}`;
      const symbols = this.matchSymbols(text);
      const impact = this.detectImpact(text);
      const publishedAt = item.publishedAt ? new Date(item.publishedAt) : new Date();

      const existing = await this.prisma.news.findUnique({
        where: { source_externalId: { source: source.id, externalId: item.guid } },
        select: { id: true },
      });
      if (existing) {
        await this.prisma.news.update({
          where: { id: existing.id },
          data: {
            title: item.title,
            url: item.url === '#' ? null : item.url,
            summary: item.summary || null,
            impact,
            symbols,
          },
        });
        updated += 1;
      } else {
        await this.prisma.news.create({
          data: {
            source: source.id,
            externalId: item.guid,
            title: item.title,
            url: item.url === '#' ? null : item.url,
            summary: item.summary || null,
            impact,
            impactConfidence: source.weight,
            expectedDuration: impact === 'high' ? '短期' : impact === 'medium' ? '中期' : '长期',
            symbols,
            publishedAt,
          },
        });
        created += 1;
      }
    }
    return { created, updated };
  }

  private matchSymbols(text: string): string[] {
    const lower = text.toLowerCase();
    const out: string[] = [];
    for (const [symbol, keywords] of SYMBOL_KEYWORDS) {
      if (keywords.some((kw) => lower.includes(kw))) out.push(symbol);
    }
    return out;
  }

  private detectImpact(text: string): string {
    const lower = text.toLowerCase();
    if (HIGH_IMPACT.some((kw) => lower.includes(kw))) return 'high';
    if (MEDIUM_IMPACT.some((kw) => lower.includes(kw))) return 'medium';
    return 'low';
  }
}

