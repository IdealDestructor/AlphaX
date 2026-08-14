import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Aggregate public-market sentiment per symbol.
 *
 * In this mock-first build the sentiment score is derived deterministically
 * from the sum of `impact` weights of each symbol's most recent News rows and a
 * stable hash of the symbol code, so results are reproducible between calls and
 * do not require a dedicated sentiment data pipeline. Real deployments should
 * swap `computeSymbolScore` for the Sentiment Agent (see docs/AGENTS.md).
 */
@Injectable()
export class SentimentService {
  constructor(private prisma: PrismaService) {}

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

    return {
      items: list,
      total: bySymbol.size,
      generatedAt: new Date().toISOString(),
    };
  }

  async getSentimentBySymbol(symbol: string) {
    const list = await this.getSentiment(symbol);
    return list.items[0] ?? null;
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
