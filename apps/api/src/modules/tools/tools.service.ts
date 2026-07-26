import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async positionCalculator(params: {
    balance: number;
    riskPercent: number;
    entry: number;
    stopLoss: number;
    takeProfit?: number;
    symbol?: string;
  }) {
    const { balance, riskPercent, entry, stopLoss, takeProfit, symbol } = params;

    const riskAmount = balance * (riskPercent / 100);
    const riskPerUnit = Math.abs(entry - stopLoss);

    if (riskPerUnit === 0) {
      return { error: 'Stop loss cannot equal entry price' };
    }

    let tickSize = 0.01;
    if (symbol) {
      const sym = await this.prisma.symbol.findUnique({ where: { code: symbol } });
      if (sym?.tickSize) {
        tickSize = sym.tickSize.toNumber();
      }
    }

    const qty = Math.round(riskAmount / riskPerUnit);
    const positionValue = qty * entry;

    let rr: number | null = null;
    if (takeProfit) {
      rr = Math.round((Math.abs(takeProfit - entry) / riskPerUnit) * 100) / 100;
    }

    return {
      symbol,
      balance,
      riskPercent,
      riskAmount: Math.round(riskAmount * 100) / 100,
      entry,
      stopLoss,
      takeProfit: takeProfit ?? null,
      qty,
      positionValue: Math.round(positionValue * 100) / 100,
      riskPerUnit: Math.round(riskPerUnit * 100) / 100,
      tickSize,
      rr,
    };
  }
}
