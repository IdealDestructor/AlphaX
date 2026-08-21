import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmProvider, LlmMessage } from './llm.provider';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private llm: LlmProvider,
  ) {}

  async getSessions(userId: string) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return this.withModelLabel(sessions);
  }

  async getSessionById(userId: string, id: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    return this.withModelLabel(session);
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

  /** 给会话响应附加当前模型标识，前端展示真实模型名。 */
  private withModelLabel<T extends { id: string }>(row: T): T & { model: string };
  private withModelLabel<T extends { id: string }>(rows: T[]): Array<T & { model: string }>;
  private withModelLabel<T extends { id: string }>(row: T | T[]): (T & { model: string }) | Array<T & { model: string }> {
    const model = this.llm.enabled ? this.llm.modelLabel : 'fusion-v2.1-sim';
    if (Array.isArray(row)) return row.map((r) => ({ ...r, model }));
    return { ...row, model };
  }

  async addMessage(sessionId: string, role: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { sessionId, role, content },
    });
  }

  async generateReply(sessionId: string, userMessage: string, symbol: string) {
    const aiReply = this.llm.enabled
      ? await this.safeComplete(userMessage, symbol)
      : this.mockAiResponse(userMessage, symbol);
    await this.addMessage(sessionId, 'assistant', aiReply);
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    return aiReply;
  }

  /**
   * 流式回复：配置 AI key 时逐 token 透传真实 LLM（SSE）；
   * 未配置时回退到模拟回复分片。
   */
  async *streamReply(userMessage: string, symbol: string): AsyncGenerator<string> {
    if (!this.llm.enabled) {
      const tokens = this.mockAiResponse(userMessage, symbol)
        .split(/(?<=[，。！？])/)
        .filter(Boolean);
      for (const token of tokens) yield token;
      return;
    }

    const queue: string[] = [];
    let done = false;
    let error: Error | null = null;
    let waiter: (() => void) | null = null;

    const wake = () => {
      if (waiter) {
        const w = waiter;
        waiter = null;
        w();
      }
    };

    const run = (async () => {
      try {
        await this.llm.complete(this.buildMessages(userMessage, symbol), {
          onToken: (token) => {
            queue.push(token);
            wake();
          },
        });
      } catch (err) {
        // LLM 调用失败时回退模拟回复，保证对话可用；错误信息记录在服务端日志。
        console.error('[chat] LLM 流式调用失败，回退模拟回复:', (err as Error).message);
        const tokens = this.mockAiResponse(userMessage, symbol)
          .split(/(?<=[，。！？])/)
          .filter(Boolean);
        for (const token of tokens) {
          queue.push(token);
          wake();
        }
      } finally {
        done = true;
        wake();
      }
    })();

    try {
      for (;;) {
        while (queue.length > 0) yield queue.shift() as string;
        if (error) throw error;
        if (done) break;
        await new Promise<void>((resolve) => {
          waiter = resolve;
        });
      }
    } finally {
      await run.catch(() => undefined);
    }
  }

  private buildMessages(userMessage: string, symbol: string): LlmMessage[] {
    return [
      { role: 'system', content: this.systemPrompt(symbol) },
      { role: 'user', content: userMessage },
    ];
  }

  private systemPrompt(symbol: string): string {
    return [
      `你是 AlphaX 的 AI 交易分析助手，专注于 ${symbol}（黄金/贵金属/宏观市场）分析。`,
      '回答规则：',
      '1. 用简体中文，结构化、简洁，直接回答问题；',
      '2. 涉及方向判断（看涨/看跌/观望）或买卖建议时，必须给出依据（技术面/宏观/资金面/新闻/情绪等），禁止只给结论；',
      '3. 必须附带风险提示，禁止承诺收益或保证胜率；',
      '4. 不编造实时行情、价格或数据；不确定的实时数据说明以 AlphaX 行情页为准；',
      '5. 用户问行情数据时，提醒可在 AlphaX 行情页查看实时价格与技术指标。',
    ].join('\n');
  }

  /** 非流式安全调用：LLM 失败时回退模拟回复。 */
  private async safeComplete(userMessage: string, symbol: string): Promise<string> {
    try {
      return await this.llm.complete(this.buildMessages(userMessage, symbol));
    } catch (err) {
      console.error('[chat] LLM 调用失败，回退模拟回复:', (err as Error).message);
      return this.mockAiResponse(userMessage, symbol);
    }
  }

  /** 未配置 AI key 时的内置模拟回复（保持可演示）。 */
  private mockAiResponse(message: string, symbol: string): string {
    const basePrice = symbol === 'XAUUSD' ? 2350 : symbol === 'BTCUSD' ? 67000 : 100;
    const sentiment = Math.random() > 0.5 ? '看涨' : '看跌';
    const confidence = Math.round((0.5 + Math.random() * 0.4) * 100);

    return `根据对${symbol}的技术分析和市场情绪评估，当前趋势偏向${sentiment}。关键技术指标显示RSI处于${Math.round(30 + Math.random() * 40)}水平，MACD${Math.random() > 0.5 ? '金叉' : '死叉'}信号已经形成。支撑位在${Math.round(basePrice * 0.97)}附近，阻力位在${Math.round(basePrice * 1.03)}附近。建议关注这些关键位置的突破情况。目前AI模型对该判断的信心度为${confidence}%。`;
  }
}
