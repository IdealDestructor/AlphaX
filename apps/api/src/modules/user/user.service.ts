import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: '用户不存在' });
    const { passwordHash, ...profile } = user;
    return profile;
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; locale?: string; timezone?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName?.trim(),
        locale: data.locale,
        timezone: data.timezone,
      },
    });
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: '用户不存在' });
    }
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException({ code: 'INVALID_OLD_PASSWORD', message: '当前密码不正确' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: '用户不存在' });
    return {
      locale: user.locale,
      timezone: user.timezone,
      currency: user.currency,
      colorScheme: user.colorScheme,
      notifications: user.notifications,
    };
  }

  async updateSettings(
    userId: string,
    data: {
      locale?: string;
      timezone?: string;
      currency?: string;
      colorScheme?: string;
      notifications?: Prisma.InputJsonValue;
    },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data });
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
    if (!symbol) throw new NotFoundException({ code: 'SYMBOL_NOT_FOUND', message: '标的不存在' });
    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_symbolId: { userId, symbolId: symbol.id } },
    });
    if (existing) throw new ConflictException({ code: 'ALREADY_IN_WATCHLIST', message: '该标的已在自选' });
    return this.prisma.watchlist.create({
      data: { userId, symbolId: symbol.id, sortOrder: 0 },
      include: { symbol: true },
    });
  }

  async removeWatchlist(userId: string, symbolCode: string) {
    const symbol = await this.prisma.symbol.findUnique({ where: { code: symbolCode } });
    if (!symbol) throw new NotFoundException({ code: 'SYMBOL_NOT_FOUND', message: '标的不存在' });
    const item = await this.prisma.watchlist.findUnique({
      where: { userId_symbolId: { userId, symbolId: symbol.id } },
    });
    if (!item) throw new NotFoundException({ code: 'NOT_IN_WATCHLIST', message: '该标的不在自选' });
    await this.prisma.watchlist.delete({ where: { id: item.id } });
  }
}
