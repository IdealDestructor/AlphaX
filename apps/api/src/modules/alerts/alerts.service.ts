import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { CreateAlertDto, UpdateAlertDto } from './dto';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private entitlements: EntitlementsService,
  ) {}

  async getAlerts(userId: string, type?: string, status?: string) {
    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;
    return this.prisma.alert.findMany({
      where,
      include: { symbol: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAlertById(userId: string, id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.userId !== userId) throw new ForbiddenException();
    return alert;
  }

  async createAlert(userId: string, dto: CreateAlertDto) {
    await this.entitlements.assertQuota(userId, 'alerts');
    return this.prisma.alert.create({
      data: {
        userId,
        type: dto.type as any,
        symbolId: dto.symbolId,
        condition: dto.condition || {},
        channels: dto.channels || ['email'],
        note: dto.note,
      },
      include: { symbol: true },
    });
  }

  async updateAlert(userId: string, id: string, dto: UpdateAlertDto) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.userId !== userId) throw new ForbiddenException();

    return this.prisma.alert.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type as any }),
        ...(dto.symbolId !== undefined && { symbolId: dto.symbolId }),
        ...(dto.condition && { condition: dto.condition }),
        ...(dto.channels && { channels: dto.channels }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      include: { symbol: true },
    });
  }

  async deleteAlert(userId: string, id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.userId !== userId) throw new ForbiddenException();
    await this.prisma.alert.delete({ where: { id } });
  }
}
