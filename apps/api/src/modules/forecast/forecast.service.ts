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
      return this.formatForecast(existing, symbol);
    }

    return this.generateAndSave(sym, symbol, horizon);
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

  private formatForecast(f: any, symbol: string) {
    return {
      symbol,
      horizon: f.horizon,
      pUp: f.pUp?.toNumber(),
      pDown: f.pDown?.toNumber(),
      pRange: f.pRange?.toNumber(),
      medianPrice: f.medianPrice?.toNumber(),
      lowBound: f.lowBound?.toNumber(),
      highBound: f.highBound?.toNumber(),
      confidence: f.confidence?.toNumber(),
      createdAt: f.createdAt.toISOString(),
    };
  }

  private async generateAndSave(sym: any, symbol: string, horizon: string) {
    const basePrice = symbol === 'XAUUSD' ? 2350 : symbol === 'BTCUSD' ? 67000 : symbol === 'DXY' ? 104.5 : 100;
    const volatilityMap: Record<string, number> = { '1d': 0.02, '1w': 0.05, '1m': 0.1, '3m': 0.18 };
    const volatility = volatilityMap[horizon] || 0.05;
    const pUp = 0.3 + Math.random() * 0.5;
    const pDown = 0.3 + Math.random() * 0.5;
    const median = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const halfRange = basePrice * volatility * 0.8;

    const saved = await this.prisma.forecast.create({
      data: {
        symbolId: sym.id,
        horizon,
        pUp: Math.round(pUp * 10000) / 10000,
        pDown: Math.round(pDown * 10000) / 10000,
        pRange: Math.round((1 - Math.abs(pUp - pDown)) * 10000) / 10000,
        medianPrice: Math.round(median * 100) / 100,
        lowBound: Math.round((median - halfRange) * 100) / 100,
        highBound: Math.round((median + halfRange) * 100) / 100,
        confidence: Math.round((0.5 + Math.random() * 0.4) * 10000) / 10000,
      },
    });

    return this.formatForecast(saved, symbol);
  }
}
