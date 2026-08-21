import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmProvider } from './llm.provider';

@Module({
  controllers: [ChatController],
  providers: [ChatService, LlmProvider],
})
export class ChatModule {}
