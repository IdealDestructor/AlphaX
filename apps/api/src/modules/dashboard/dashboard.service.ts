import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketDataRegistry } from '../market/providers/registry';
import { SentimentService } from '../sentiment/sentiment.service';
import { SmartMoneyService } from '../smart-money/smart-money.service';
import { AnalysisService } from '../analysis/analysis.service';

/**
 * 首页看板。
 * 真实化进度（2026-08-21）：市场情绪分接入 CNN Fear & Greed（真实）；ETF/COT 字段接入真实 Smart Money；
 * 不再 Math.random 编造 sentiment/etfInflow/cotChange。
 */
@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private registry: MarketDataRegistry,
    private sentiment: SentimentService,
    private smartMoney: SmartMoneyService,
    private analysis: AnalysisService,
  ) {}

  async getDashboard(symbol: string) {
    const symbolRecord = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!symbolRecord) {
      throw new NotFoundException(`Symbol ${symbol} not found`);
    }

    const [analysis, signals, newsList, quotes, marketSentiment, smart] = await Promise.all([
      this.analysis.getAnalysis(symbolRecord.code, '4h'),
      this.getSignals(symbolRecord),
      this.getNews(symbol),
      this.registry.getQuotes([symbolRecord.code]),
      this.sentiment.buildMarketSentiment(),
      this.smartMoney.getSmartMoneyBySymbol('XAUUSD'),
    ]);

    // Market overview quotes: prefer real data sources, registry falls back to mock on failure
    const quote = quotes[0] ?? this.generateQuote(symbolRecord.code);
    const kpi = this.buildKpi(quote, analysis, marketSentiment);
    const ticker = await this.getTicker();
    const sentiment = this.buildSentiment(marketSentiment, smart);

    return {
      kpi,
      ticker,
      analysis: {
        symbol: symbolRecord.code,
        trend: analysis?.trend ?? 'neutral',
        action: analysis?.action === 'hold' ? 'wait' : (analysis?.action ?? 'wait'),
        confidence: analysis ? Math.round(analysis.confidence * 100) : 55,
        riskLevel: analysis?.riskLevel ?? 'medium',
        levels: {
          entry: analysis?.entry != null ? analysis.entry.toFixed(1) : '—',
          stopLoss: analysis?.stopLoss != null ? analysis.stopLoss.toFixed(1) : '—',
          takeProfit: analysis?.takeProfit != null ? analysis.takeProfit.toFixed(1) : '—',
        },
        reasons: Array.isArray(analysis?.reasons)
          ? analysis.reasons
          : ['技术指标显示趋势信号', '成交量支持当前方向', '市场情绪偏积极'],
        evidence: Array.isArray(analysis?.evidence)
          ? analysis.evidence.slice(0, 5)
          : [],
        updatedAt: `更新 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`,
        model: (analysis?.modelVersions as { version?: string } | null | undefined)?.version ?? 'fusion-v2.1',
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

  private buildKpi(quote: any, analysis: any, marketSentiment: Awaited<ReturnType<SentimentService['buildMarketSentiment']>>) {
    const confidence = analysis ? Math.round((analysis.confidence ?? 0.5) * 100) : 50;
    const sentimentScore = marketSentiment?.score;
    return {
      price: quote.price,
      priceChangeAbs: quote.change,
      priceChangePct: quote.changePercent,
      confidence,
      confidenceDelta: analysis && analysis.confidence != null ? Math.round((analysis.confidence - 0.5) * 20) : 0,
      riskLevel: analysis?.riskLevel ?? 'medium',
      atr: Math.round(this.basePrice(quote.symbol) * 0.008 * 100) / 100,
      sentiment: sentimentScore != null ? Math.round(sentimentScore * 25 + 50) : null,
      sentimentLabel: sentimentScore != null ? (marketSentiment?.rating ?? '综合市场情绪') : '情绪数据暂不可用',
    };
  }

  private async getTicker() {
    const symbols = await this.prisma.symbol.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      take: 10,
    });
    const quotes = await this.registry.getQuotes(symbols.map((s) => s.code));
    const byCode = new Map(quotes.map((q) => [q.symbol, q]));
    return symbols.map((s) => {
      const q = byCode.get(s.code) ?? this.generateQuote(s.code);
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

  /** 市场情绪 + 聪明钱（真实 COT）驱动，不再随机。 */
  private buildSentiment(
    marketSentiment: Awaited<ReturnType<SentimentService['buildMarketSentiment']>>,
    smart: Awaited<ReturnType<SmartMoneyService['getSmartMoneyBySymbol']>> | null,
  ) {
    const score = marketSentiment?.score != null ? Math.round(marketSentiment.score * 25 + 50) : 50;
    const label = score > 60 ? '偏多' : score < 40 ? '偏空' : '中性';
    const cot = smart?.cot;
    const etf = smart?.etf;
    return {
      score,
      label,
      sentimentSource: marketSentiment?.source ?? 'mock',
      longPct: cot ? Math.round((cot.specLong / Math.max(1, cot.specLong + cot.specShort)) * 100) : null,
      shortPct: cot ? Math.round((cot.specShort / Math.max(1, cot.specLong + cot.specShort)) * 100) : null,
      etfInflow: etf ? `${etf.netFlow >= 0 ? '+' : ''}${etf.netFlow.toFixed(1)}$M` : null,
      cotChange: cot ? `${cot.netSpecLong >= 0 ? '+' : ''}${(cot.netSpecLong / 1000).toFixed(1)}k` : null,
      cotSource: smart?.sources?.cot ?? 'mock',
    };
  }
}

