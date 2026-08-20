import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class WatchlistService {
  constructor(
    private prisma: PrismaService,
    private entitlements: EntitlementsService,
  ) {}

  async getWatchlist(userId: string) {
    const rows = await this.prisma.watchlist.findMany({
      where: { userId },
      include: { symbol: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(({ symbol, sortOrder, createdAt }) => ({
      symbol: symbol.code,
      name: symbol.name,
      assetClass: symbol.assetClass,
      sortOrder,
      addedAt: createdAt.toISOString(),
    }));
  }

  async addWatchlist(userId: string, symbolCode: string) {
    await this.entitlements.assertQuota(userId, 'watchlist');
    const symbol = await this.prisma.symbol.findUnique({ where: { code: symbolCode } });
    if (!symbol) throw new NotFoundException(`Symbol not found: ${symbolCode}`);
    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_symbolId: { userId, symbolId: symbol.id } },
    });
    if (existing) throw new ConflictException('Symbol already in watchlist');
    const added = await this.prisma.watchlist.create({
      data: { userId, symbolId: symbol.id, sortOrder: 0 },
      include: { symbol: true },
    });
    return { symbol: added.symbol.code, sortOrder: added.sortOrder };
  }

  async removeWatchlist(userId: string, symbolCode: string) {
    const symbol = await this.prisma.symbol.findUnique({ where: { code: symbolCode } });
    if (!symbol) throw new NotFoundException(`Symbol not found: ${symbolCode}`);
    const item = await this.prisma.watchlist.findUnique({
      where: { userId_symbolId: { userId, symbolId: symbol.id } },
    });
    if (!item) throw new NotFoundException(`Symbol not in watchlist: ${symbolCode}`);
    await this.prisma.watchlist.delete({ where: { id: item.id } });
  }
}
