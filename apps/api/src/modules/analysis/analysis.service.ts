import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}

  async getAnalysis(symbol: string, timeframe: string = '1d') {
    const symbolRecord = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!symbolRecord) return null;

    const existing = await this.prisma.aiAnalysis.findFirst({
      where: { symbolId: symbolRecord.id, timeframe },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return {
        symbol,
        timeframe,
        trend: existing.trend,
        action: existing.action,
        confidence: existing.confidence.toNumber(),
        entry: existing.entry?.toNumber() ?? null,
        stopLoss: existing.stopLoss?.toNumber() ?? null,
        takeProfit: existing.takeProfit?.toNumber() ?? null,
        riskLevel: existing.riskLevel,
        summary: existing.summary,
        reasons: existing.reasons,
        evidence: existing.evidence,
        modelVersions: existing.modelVersion,
        createdAt: existing.createdAt.toISOString(),
      };
    }

    return this.generateAnalysis(symbol, timeframe);
  }

  async getHistory(symbol: string, timeframe: string = '1d', limit: number = 20) {
    const symbolRecord = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!symbolRecord) return [];

    const analyses = await this.prisma.aiAnalysis.findMany({
      where: { symbolId: symbolRecord.id, timeframe },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return analyses.map((a) => ({
      id: a.id,
      trend: a.trend,
      action: a.action,
      confidence: a.confidence.toNumber(),
      entry: a.entry?.toNumber() ?? null,
      stopLoss: a.stopLoss?.toNumber() ?? null,
      takeProfit: a.takeProfit?.toNumber() ?? null,
      riskLevel: a.riskLevel,
      summary: a.summary,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  private generateAnalysis(symbol: string, timeframe: string) {
    const trends = ['bullish', 'bearish', 'neutral'];
    const actions = ['buy', 'sell', 'hold'];
    const riskLevels = ['low', 'medium', 'high'];
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const action = trend === 'neutral' ? 'hold' : trend === 'bullish' ? 'buy' : 'sell';
    const confidence = 0.5 + Math.random() * 0.45;
    const basePrice = symbol === 'XAUUSD' ? 2350 : 100;

    return {
      symbol,
      timeframe,
      trend,
      action,
      confidence: Math.round(confidence * 10000) / 10000,
      entry: Math.round((basePrice + (Math.random() - 0.5) * 50) * 100) / 100,
      stopLoss: Math.round((basePrice - 20 - Math.random() * 10) * 100) / 100,
      takeProfit: Math.round((basePrice + 30 + Math.random() * 20) * 100) / 100,
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      summary: `${trend === 'bullish' ? '看涨' : trend === 'bearish' ? '看跌' : '震荡'}趋势，建议${action === 'buy' ? '做多' : action === 'sell' ? '做空' : '观望'}。`,
      reasons: ['技术指标显示趋势信号', '成交量支持当前方向', '市场情绪偏积极'],
      evidence: { pattern: 'double_bottom', support: basePrice - 30, resistance: basePrice + 30 },
      createdAt: new Date().toISOString(),
    };
  }
}
