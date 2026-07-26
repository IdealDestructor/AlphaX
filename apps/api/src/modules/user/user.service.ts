import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, data: { displayName?: string; locale?: string; timezone?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new NotFoundException('Invalid current password');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async getWatchlist(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: { symbol: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addWatchlist(userId: string, symbolCode: string) {
    const symbol = await this.prisma.symbol.findUnique({ where: { code: symbolCode } });
    if (!symbol) throw new NotFoundException('Symbol not found');
    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_symbolId: { userId, symbolId: symbol.id } },
    });
    if (existing) throw new ConflictException('Symbol already in watchlist');
    return this.prisma.watchlist.create({
      data: { userId, symbolId: symbol.id, sortOrder: 0 },
      include: { symbol: true },
    });
  }

  async removeWatchlist(userId: string, symbolCode: string) {
    const symbol = await this.prisma.symbol.findUnique({ where: { code: symbolCode } });
    if (!symbol) throw new NotFoundException('Symbol not found');
    const item = await this.prisma.watchlist.findUnique({
      where: { userId_symbolId: { userId, symbolId: symbol.id } },
    });
    if (!item) throw new NotFoundException('Symbol not in watchlist');
    await this.prisma.watchlist.delete({ where: { id: item.id } });
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return {
      locale: user.locale,
      timezone: user.timezone,
      plan: user.plan,
    };
  }

  async updateSettings(userId: string, data: { locale?: string; timezone?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }
}
