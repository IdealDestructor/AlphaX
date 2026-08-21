import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateSessionDto, SendMessageDto, UpdateSessionDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('sessions')
  getSessions(@CurrentUser('id') userId: string) {
    return this.chat.getSessions(userId);
  }

  @Post('sessions')
  createSession(@CurrentUser('id') userId: string, @Body() dto: CreateSessionDto) {
    return this.chat.createSession(userId, dto.title, dto.symbol);
  }

  @Get('sessions/:id')
  getSession(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chat.getSessionById(userId, id);
  }

  @Patch('sessions/:id')
  updateSession(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.chat.updateSession(userId, id, dto);
  }

  @Delete('sessions/:id')
  async deleteSession(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.chat.deleteSession(userId, id);
    return { ok: true };
  }

  @Post('messages')
  async sendMessage(@CurrentUser('id') userId: string, @Body() dto: SendMessageDto, @Res() res: Response) {
    let sessionId = dto.sessionId;

    if (!sessionId) {
      const session = await this.chat.createSession(userId, dto.content.slice(0, 30), 'XAUUSD');
      sessionId = session.id;
    }

    const activeId: string = sessionId as string;
    const session = await this.chat.getSessionById(userId, activeId);
    await this.chat.addMessage(activeId, 'user', dto.content);

    const aiReply = await this.chat.generateReply(activeId, dto.content, session.symbol);

    res.json({
      data: {
        id: activeId,
        role: 'assistant',
        content: aiReply,
        createdAt: new Date().toISOString(),
      },
    });
  }

  @Post('stream')
  async streamMessage(@CurrentUser('id') userId: string, @Body() dto: SendMessageDto, @Res() res: Response) {
    let sessionId = dto.sessionId;

    if (!sessionId) {
      const session = await this.chat.createSession(userId, dto.content.slice(0, 30), 'XAUUSD');
      sessionId = session.id;
    }

    const activeId: string = sessionId as string;
    const session = await this.chat.getSessionById(userId, activeId);
    await this.chat.addMessage(activeId, 'user', dto.content);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullContent = '';

    for await (const token of this.chat.streamReply(dto.content, session.symbol)) {
      fullContent += token;
      res.write(`data: ${JSON.stringify({ token, sessionId: activeId })}\n\n`);
      await new Promise((r) => setTimeout(r, 30));
    }

    await this.chat.addMessage(activeId, 'assistant', fullContent);
    res.write(`data: ${JSON.stringify({ done: true, sessionId: activeId })}\n\n`);
    res.end();
  }
}
