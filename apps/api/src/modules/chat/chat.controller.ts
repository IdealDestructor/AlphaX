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
  deleteSession(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chat.deleteSession(userId, id);
  }

  @Post('messages')
  async sendMessage(@CurrentUser('id') userId: string, @Body() dto: SendMessageDto, @Res() res: Response) {
    let sessionId = dto.sessionId;

    if (!sessionId) {
      const session = await this.chat.createSession(userId, dto.content.slice(0, 30), 'XAUUSD');
      sessionId = session.id;
    }

    const session = await this.chat.getSessionById(userId, sessionId);
    await this.chat.addMessage(sessionId, 'user', dto.content);

    const aiReply = await this.chat.generateReply(sessionId, dto.content, session.symbol);

    res.json({
      data: {
        id: sessionId,
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

    const session = await this.chat.getSessionById(userId, sessionId);
    await this.chat.addMessage(sessionId, 'user', dto.content);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const tokens = await this.chat.streamReply(dto.content, session.symbol);
    let fullContent = '';

    for (const token of tokens) {
      fullContent += token;
      res.write(`data: ${JSON.stringify({ token, sessionId })}\n\n`);
      await new Promise((r) => setTimeout(r, 50));
    }

    await this.chat.addMessage(sessionId, 'assistant', fullContent);
    res.write(`data: ${JSON.stringify({ done: true, sessionId })}\n\n`);
    res.end();
  }
}
