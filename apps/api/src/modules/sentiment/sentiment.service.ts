import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FearGreedProvider } from './providers/fear-greed.provider';

/**
 * Aggregate public-market sentiment per symbol.
 *
 * 真实化进度（2026-08-21）：
 * - news 分量：基于真实 News 行的 impact 权重（真实）
 * - market 分量：接入 CNN Fear & Greed 指数（真实，sources.market='cnn'）；失败降级 null/估算
 * - social 分量：暂无可靠免费 API，保留稳定哈希估算（sources.social='mock'）
 */
@Injectable()
export class SentimentService {
  constructor(
    private prisma: PrismaService,
    private fearGreed: FearGreedProvider,
  ) {}

  async getSentiment(symbol?: string) {
    const items = await this.prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 200,
    });

    const bySymbol = new Map<string, { count: number; sum: number }>();

    for (const n of items) {
      for (const sym of n.symbols) {
        const bucket = bySymbol.get(sym) ?? { count: 0, sum: 0 };
        bucket.count += 1;
        bucket.sum += this.impactWeight(n.impact);
        bySymbol.set(sym, bucket);
      }
    }

    let list = Array.from(bySymbol.entries()).map(([code, b]) => {
      const aggregation = b.sum / Math.max(1, b.count);
      const score = this.clamp(this.hash01(code) * 0.3 + aggregation * 0.7, -1, 1);
      return this.format(code, score, b.count);
    });

    if (symbol) list = list.filter((s) => s.symbol === symbol);

    const market = await this.buildMarketSentiment();

    return {
      items: list,
      total: bySymbol.size,
      market,
      generatedAt: new Date().toISOString(),
    };
  }

  async getSentimentBySymbol(symbol: string) {
    const list = await this.getSentiment(symbol);
    return list.items[0] ?? null;
  }

  /** 市场级真实情绪（CNN Fear & Greed，0–100 → -1..1） */
  async buildMarketSentiment() {
    const fg = await this.fearGreed.getSnapshot();
    if (!fg) {
      return {
        score: null,
        label: '未知',
        rating: null,
        source: 'mock' as const,
        updatedAt: null,
      };
    }
    const score = this.clamp((fg.value - 50) / 50, -1, 1);
    return {
      score: Math.round(score * 100) / 100,
      label: fg.value > 60 ? '贪婪' : fg.value < 40 ? '恐慌' : '中性',
      rating: fg.rating,
      source: 'cnn' as const,
      updatedAt: fg.updatedAt,
    };
  }

  private format(code: string, score: number, newsCount: number) {
    return {
      symbol: code,
      score,
      label: score > 0.15 ? 'bullish' : score < -0.15 ? 'bearish' : 'neutral',
      intensity: Math.abs(score),
      newsCount,
      components: {
        news: score,
        social: this.hash01(`${code}:social`) * 0.6 - 0.3,
      },
      sources: {
        news: 'real' as const,
        social: 'mock' as const,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  private impactWeight(impact?: string | null): number {
    if (impact === 'high') return 0.5;
    if (impact === 'medium') return 0.2;
    if (impact === 'low') return 0.05;
    return 0;
  }

  private hash01(seed: string): number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }
}
