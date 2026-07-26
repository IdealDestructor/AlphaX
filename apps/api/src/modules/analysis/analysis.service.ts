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
      return this.formatAnalysis(existing, symbol);
    }

    return this.generateAndSave(symbolRecord, symbol, timeframe);
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

  private formatAnalysis(a: any, symbol: string) {
    return {
      symbol,
      timeframe: a.timeframe,
      trend: a.trend,
      action: a.action,
      confidence: a.confidence.toNumber(),
      entry: a.entry?.toNumber() ?? null,
      stopLoss: a.stopLoss?.toNumber() ?? null,
      takeProfit: a.takeProfit?.toNumber() ?? null,
      riskLevel: a.riskLevel,
      summary: a.summary,
      reasons: a.reasons,
      evidence: a.evidence,
      modelVersions: a.modelVersion,
      createdAt: a.createdAt.toISOString(),
    };
  }

  private async generateAndSave(symbolRecord: any, symbol: string, timeframe: string) {
    const basePrice = symbol === 'XAUUSD' ? 2350 : symbol === 'BTCUSD' ? 67000 : symbol === 'DXY' ? 104.5 : 100;

    const trendRand = Math.random();
    const trend = trendRand > 0.6 ? 'bullish' : trendRand > 0.25 ? 'bearish' : 'neutral';
    const action = trend === 'neutral' ? 'hold' : trend === 'bullish' ? 'buy' : 'sell';
    const confidence = 0.5 + Math.random() * 0.45;
    const riskLevels = ['low', 'medium', 'high'];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    const reasons = [
      '价格行为显示趋势结构完整',
      '成交量支持当前方向',
      '市场情绪偏积极',
      '关键技术指标形成共振',
    ].slice(0, 2 + Math.floor(Math.random() * 3));

    const evidence = {
      pattern: ['double_bottom', 'head_shoulders', 'bull_flag', 'ascending_triangle'][Math.floor(Math.random() * 4)],
      support: Math.round((basePrice - 20 - Math.random() * 15) * 100) / 100,
      resistance: Math.round((basePrice + 20 + Math.random() * 15) * 100) / 100,
    };

    const summary = `${trend === 'bullish' ? '看涨' : trend === 'bearish' ? '看跌' : '震荡'}趋势，建议${action === 'buy' ? '做多' : action === 'sell' ? '做空' : '观望'}。`;

    const saved = await this.prisma.aiAnalysis.create({
      data: {
        symbolId: symbolRecord.id,
        timeframe,
        trend,
        action,
        confidence,
        entry: Math.round((basePrice + (Math.random() - 0.5) * 50) * 100) / 100,
        stopLoss: Math.round((basePrice - 20 - Math.random() * 10) * 100) / 100,
        takeProfit: Math.round((basePrice + 30 + Math.random() * 20) * 100) / 100,
        riskLevel,
        summary,
        reasons,
        evidence,
        modelVersion: { version: 'fusion-v2.1', generatedAt: new Date().toISOString() },
      },
    });

    return this.formatAnalysis(saved, symbol);
  }
}
