import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ForecastService {
  constructor(private prisma: PrismaService) {}

  async getForecast(symbol: string, horizon: string = '1w') {
    const sym = await this.prisma.symbol.findUnique({ where: { code: symbol } });
    if (!sym) return null;

    const existing = await this.prisma.forecast.findFirst({
      where: { symbolId: sym.id, horizon },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return {
        symbol,
        horizon,
        pUp: existing.pUp?.toNumber(),
        pDown: existing.pDown?.toNumber(),
        pRange: existing.pRange?.toNumber(),
        medianPrice: existing.medianPrice?.toNumber(),
        lowBound: existing.lowBound?.toNumber(),
        highBound: existing.highBound?.toNumber(),
        confidence: existing.confidence?.toNumber(),
        createdAt: existing.createdAt.toISOString(),
      };
    }

    return this.generateForecast(symbol, horizon);
  }

  async getForecasts(symbol?: string) {
    const where: any = {};
    if (symbol) {
      const sym = await this.prisma.symbol.findUnique({ where: { code: symbol } });
      if (sym) where.symbolId = sym.id;
    }
    const forecasts = await this.prisma.forecast.findMany({
      where,
      include: { symbol: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return forecasts.map((f) => ({
      id: f.id,
      symbol: f.symbol.code,
      horizon: f.horizon,
      pUp: f.pUp?.toNumber(),
      pDown: f.pDown?.toNumber(),
      pRange: f.pRange?.toNumber(),
      medianPrice: f.medianPrice?.toNumber(),
      lowBound: f.lowBound?.toNumber(),
      highBound: f.highBound?.toNumber(),
      confidence: f.confidence?.toNumber(),
      createdAt: f.createdAt.toISOString(),
    }));
  }

  private generateForecast(symbol: string, horizon: string) {
    const basePrice = symbol === 'XAUUSD' ? 2350 : 100;
    const volatility = horizon === '1d' ? 0.02 : horizon === '1w' ? 0.05 : 0.1;
    const pUp = 0.3 + Math.random() * 0.5;
    const pDown = 0.3 + Math.random() * 0.5;
    const median = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const halfRange = basePrice * volatility * 0.8;

    return {
      symbol,
      horizon,
      pUp: Math.round(pUp * 10000) / 10000,
      pDown: Math.round(pDown * 10000) / 10000,
      pRange: Math.round((1 - Math.abs(pUp - pDown)) * 10000) / 10000,
      medianPrice: Math.round(median * 100) / 100,
      lowBound: Math.round((median - halfRange) * 100) / 100,
      highBound: Math.round((median + halfRange) * 100) / 100,
      confidence: Math.round((0.5 + Math.random() * 0.4) * 10000) / 10000,
      createdAt: new Date().toISOString(),
    };
  }
}
