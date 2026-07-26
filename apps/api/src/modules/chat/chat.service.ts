import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSessionById(userId: string, id: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    return session;
  }

  async createSession(userId: string, title?: string, symbol?: string) {
    return this.prisma.chatSession.create({
      data: {
        userId,
        title: title || '新对话',
        symbol: symbol || 'XAUUSD',
      },
    });
  }

  async updateSession(userId: string, id: string, data: { title?: string; symbol?: string }) {
    const session = await this.prisma.chatSession.findUnique({ where: { id } });
    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    return this.prisma.chatSession.update({ where: { id }, data });
  }

  async deleteSession(userId: string, id: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { id } });
    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    await this.prisma.chatSession.delete({ where: { id } });
  }

  async addMessage(sessionId: string, role: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { sessionId, role, content },
    });
  }

  async generateReply(sessionId: string, userMessage: string, symbol: string) {
    const aiReply = this.mockAiResponse(userMessage, symbol);
    await this.addMessage(sessionId, 'assistant', aiReply);
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    return aiReply;
  }

  async streamReply(userMessage: string, symbol: string): Promise<string[]> {
    const tokens = this.mockAiResponse(userMessage, symbol).split(/(?<=[，。！？])/);
    return tokens.filter(Boolean);
  }

  private mockAiResponse(message: string, symbol: string): string {
    const basePrice = symbol === 'XAUUSD' ? 2350 : symbol === 'BTCUSD' ? 67000 : 100;
    const sentiment = Math.random() > 0.5 ? '看涨' : '看跌';
    const confidence = Math.round((0.5 + Math.random() * 0.4) * 100);

    return `根据对${symbol}的技术分析和市场情绪评估，当前趋势偏向${sentiment}。关键技术指标显示RSI处于${Math.round(30 + Math.random() * 40)}水平，MACD${Math.random() > 0.5 ? '金叉' : '死叉'}信号已经形成。支撑位在${Math.round(basePrice * 0.97)}附近，阻力位在${Math.round(basePrice * 1.03)}附近。建议关注这些关键位置的突破情况。目前AI模型对该判断的信心度为${confidence}%。`;
  }
}
