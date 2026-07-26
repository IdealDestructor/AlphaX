import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJournalDto, UpdateJournalDto } from './dto';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async getJournals(userId: string, symbol?: string, limit: number = 50, offset: number = 0) {
    const where: any = { userId };
    if (symbol) {
      const sym = await this.prisma.symbol.findUnique({ where: { code: symbol } });
      if (sym) where.symbolId = sym.id;
    }

    const [items, total] = await Promise.all([
      this.prisma.journal.findMany({
        where,
        include: { symbol: true },
        orderBy: { openedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.journal.count({ where }),
    ]);

    return {
      items: items.map(this.formatJournal),
      total,
      page: offset > 0 ? Math.floor(offset / limit) + 1 : 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getJournalById(userId: string, id: string) {
    const journal = await this.prisma.journal.findUnique({
      where: { id },
      include: { symbol: true },
    });
    if (!journal) throw new NotFoundException('Journal not found');
    if (journal.userId !== userId) throw new ForbiddenException();
    return this.formatJournal(journal);
  }

  async createJournal(userId: string, dto: CreateJournalDto) {
    const journal = await this.prisma.journal.create({
      data: {
        userId,
        symbolId: dto.symbolId,
        side: dto.side,
        entryPrice: dto.entryPrice,
        exitPrice: dto.exitPrice,
        qty: dto.qty,
        profit: dto.profit,
        note: dto.note,
        tags: dto.tags || [],
        openedAt: dto.openedAt ? new Date(dto.openedAt) : undefined,
        closedAt: dto.closedAt ? new Date(dto.closedAt) : undefined,
      },
      include: { symbol: true },
    });
    return this.formatJournal(journal);
  }

  async updateJournal(userId: string, id: string, dto: UpdateJournalDto) {
    const journal = await this.prisma.journal.findUnique({ where: { id } });
    if (!journal) throw new NotFoundException('Journal not found');
    if (journal.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.journal.update({
      where: { id },
      data: {
        ...(dto.side && { side: dto.side }),
        ...(dto.entryPrice !== undefined && { entryPrice: dto.entryPrice }),
        ...(dto.exitPrice !== undefined && { exitPrice: dto.exitPrice }),
        ...(dto.qty !== undefined && { qty: dto.qty }),
        ...(dto.profit !== undefined && { profit: dto.profit }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.openedAt && { openedAt: new Date(dto.openedAt) }),
        ...(dto.closedAt && { closedAt: new Date(dto.closedAt) }),
      },
      include: { symbol: true },
    });
    return this.formatJournal(updated);
  }

  async deleteJournal(userId: string, id: string) {
    const journal = await this.prisma.journal.findUnique({ where: { id } });
    if (!journal) throw new NotFoundException('Journal not found');
    if (journal.userId !== userId) throw new ForbiddenException();
    await this.prisma.journal.delete({ where: { id } });
  }

  async getStats(userId: string) {
    const journals = await this.prisma.journal.findMany({
      where: { userId, profit: { not: null } },
    });

    const totalTrades = journals.length;
    const winningTrades = journals.filter((j) => (j.profit?.toNumber() || 0) > 0).length;
    const totalProfit = journals.reduce((sum, j) => sum + (j.profit?.toNumber() || 0), 0);

    return {
      totalTrades,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate: totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 10000) / 100 : 0,
      totalProfit: Math.round(totalProfit * 100) / 100,
      averageProfit: totalTrades > 0 ? Math.round((totalProfit / totalTrades) * 100) / 100 : 0,
    };
  }

  private formatJournal(j: any) {
    return {
      id: j.id,
      symbol: j.symbol?.code || j.symbolId,
      side: j.side,
      entryPrice: j.entryPrice?.toNumber() ?? null,
      exitPrice: j.exitPrice?.toNumber() ?? null,
      qty: j.qty?.toNumber() ?? null,
      profit: j.profit?.toNumber() ?? null,
      note: j.note,
      tags: j.tags,
      openedAt: j.openedAt?.toISOString() ?? null,
      closedAt: j.closedAt?.toISOString() ?? null,
      createdAt: j.createdAt.toISOString(),
    };
  }
}
