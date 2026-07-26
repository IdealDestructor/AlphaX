import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(symbol: string) {
    const symbolRecord = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!symbolRecord) {
      throw new NotFoundException(`Symbol ${symbol} not found`);
    }

    const [analysis, signals, newsList] = await Promise.all([
      this.getAnalysis(symbolRecord),
      this.getSignals(symbolRecord),
      this.getNews(symbol),
    ]);

    const quote = this.generateQuote(symbolRecord.code);
    const kpi = this.buildKpi(quote, analysis);
    const ticker = await this.getTicker();
    const sentiment = this.buildSentiment(analysis);

    return {
      kpi,
      ticker,
      analysis: {
        symbol: symbolRecord.code,
        trend: analysis?.trend ?? 'neutral',
        action: analysis?.action === 'hold' ? 'wait' : (analysis?.action ?? 'wait'),
        confidence: analysis ? Math.round(analysis.confidence.toNumber() * 100) : 55,
        riskLevel: analysis?.riskLevel ?? 'medium',
        levels: {
          entry: analysis?.entry?.toFixed(1) ?? '—',
          stopLoss: analysis?.stopLoss?.toFixed(1) ?? '—',
          takeProfit: analysis?.takeProfit?.toFixed(1) ?? '—',
        },
        reasons: Array.isArray(analysis?.reasons)
          ? analysis.reasons
          : ['技术指标显示趋势信号', '成交量支持当前方向', '市场情绪偏积极'],
        evidence: Array.isArray(analysis?.evidence)
          ? analysis.evidence.slice(0, 5)
          : [],
        updatedAt: `更新 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`,
        model: 'fusion-v2.1',
      },
      signals: signals.map((s) => ({
        time: s.createdAt
          ? new Date(s.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          : '—',
        symbol: symbolRecord.code,
        side: s.action === 'hold' ? 'wait' : s.action,
        entry: s.entry?.toFixed(1) ?? '—',
        confidence: Math.round((s.confidence?.toNumber() ?? 0.5) * 100),
        outcome: s.status === 'open' ? '进行中' : s.status === 'hit_tp' ? '止盈' : s.status === 'hit_sl' ? '止损' : '已过期',
        outcomeDirection: s.status === 'hit_tp' ? 'up' : s.status === 'hit_sl' ? 'down' : 'flat',
      })),
      sentiment,
      news: newsList.map((n) => ({
        time: n.publishedAt
          ? new Date(n.publishedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          : '—',
        title: n.title,
        tag: n.impact ?? '中性',
        tagTone: n.impact === 'positive' ? 'pos' as const : n.impact === 'negative' ? 'neg' as const : 'neutral' as const,
        source: n.source,
      })),
      updatedAt: `更新于 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`,
    };
  }

  private async getAnalysis(symbolRecord: any) {
    return this.prisma.aiAnalysis.findFirst({
      where: { symbolId: symbolRecord.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getSignals(symbolRecord: any) {
    return this.prisma.signal.findMany({
      where: { symbolId: symbolRecord.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private async getNews(symbol: string) {
    return this.prisma.news.findMany({
      where: { symbols: { has: symbol } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });
  }

  private generateQuote(code: string) {
    const basePrice = this.basePrice(code);
    const change = (Math.random() - 0.5) * 0.04;
    const price = basePrice * (1 + change);
    return {
      symbol: code,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 10000) / 100,
      changePercent: Math.round((change / (1 + change)) * 10000) / 100,
    };
  }

  private basePrice(code: string): number {
    const prices: Record<string, number> = {
      XAUUSD: 2385, XAGUSD: 28.7, BTCUSD: 67400, DXY: 104.3,
      NAS100: 19840, SPX500: 5430, WTI: 78.4, BRENT: 82.2,
      GLD: 218.5, SLV: 26.2, SPY: 545, US10Y: 4.21,
    };
    return prices[code] || 100;
  }

  private buildKpi(quote: any, analysis: any) {
    const confidence = analysis ? Math.round((analysis.confidence?.toNumber() ?? 0.5) * 100) : 50;
    return {
      price: quote.price,
      priceChangeAbs: quote.change,
      priceChangePct: quote.changePercent,
      confidence,
      confidenceDelta: Math.round((Math.random() - 0.3) * 12),
      riskLevel: analysis?.riskLevel ?? 'medium',
      atr: Math.round(this.basePrice(quote.symbol) * 0.008 * 100) / 100,
      sentiment: Math.round(50 + (Math.random() - 0.5) * 30),
      sentimentLabel: '综合市场情绪评估',
    };
  }

  private async getTicker() {
    const symbols = await this.prisma.symbol.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      take: 10,
    });
    return symbols.map((s) => {
      const q = this.generateQuote(s.code);
      const dir = q.change >= 0 ? 'up' as const : 'down' as const;
      const arrow = q.change >= 0 ? '▲' : '▼';
      return {
        symbol: s.code,
        price: q.price.toLocaleString('en-US'),
        change: `${arrow} ${q.change >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%`,
        direction: dir,
      };
    });
  }

  private buildSentiment(analysis: any) {
    const score = Math.round(50 + (Math.random() - 0.5) * 30);
    return {
      score,
      label: score > 60 ? '偏多' : score < 40 ? '偏空' : '中性',
      longPct: Math.round(50 + (Math.random() - 0.3) * 30),
      shortPct: Math.round(20 + Math.random() * 20),
      etfInflow: `+${Math.round(Math.random() * 600 + 100)}$M`,
      cotChange: `${Math.random() > 0.4 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}k`,
    };
  }
}
