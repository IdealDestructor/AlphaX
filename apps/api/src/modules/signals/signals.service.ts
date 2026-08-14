import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SignalsService {
  constructor(private prisma: PrismaService) {}

  async getSignals(symbol?: string, limit: number = 50) {
    const where: any = {};
    if (symbol) {
      const sym = await this.prisma.symbol.findUnique({ where: { code: symbol } });
      if (sym) where.symbolId = sym.id;
    }
    const signals = await this.prisma.signal.findMany({
      where,
      include: { symbol: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return signals.map(this.formatSignal);
  }

  async getSignalById(id: string) {
    const signal = await this.prisma.signal.findUnique({
      where: { id },
      include: { symbol: true },
    });
    if (!signal) return null;
    return this.formatSignal(signal);
  }

  private formatSignal(s: any) {
    return {
      id: s.id,
      symbol: s.symbol.code,
      action: s.action,
      price: s.price?.toNumber() ?? null,
      entry: s.entry?.toNumber() ?? null,
      tp: s.tp?.toNumber() ?? null,
      sl: s.sl?.toNumber() ?? null,
      confidence: s.confidence?.toNumber(),
      status: s.status,
      timeframe: s.timeframe,
      createdAt: s.createdAt.toISOString(),
      closedAt: s.closedAt?.toISOString() ?? null,
      outcome: s.outcome,
    };
  }

  async getStats() {
    const [byStatus, byAction, total, tpCount, slCount] = await Promise.all([
      this.prisma.signal.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.signal.groupBy({ by: ['action'], _count: { _all: true } }),
      this.prisma.signal.count(),
      this.prisma.signal.count({ where: { status: 'hit_tp' } }),
      this.prisma.signal.count({ where: { status: 'hit_sl' } }),
    ]);

    const closed = tpCount + slCount;
    const winRate = closed > 0 ? Math.round((tpCount / closed) * 1000) / 10 : 0;

    return {
      total,
      winRate,
      win: tpCount,
      loss: slCount,
      byAction: Object.fromEntries(byAction.map((a) => [a.action, a._count._all])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    };
  }
}
