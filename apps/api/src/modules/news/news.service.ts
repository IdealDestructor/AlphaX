import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async getNews(symbol?: string, limit: number = 50, offset: number = 0) {
    const where: any = {};
    if (symbol) {
      where.symbols = { has: symbol };
    }

    const [items, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.news.count({ where }),
    ]);

    return {
      items,
      total,
      page: offset > 0 ? Math.floor(offset / limit) + 1 : 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getNewsById(id: string) {
    return this.prisma.news.findUnique({ where: { id } });
  }
}
