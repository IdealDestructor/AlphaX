import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

@Module({
  imports: [PrismaModule, EntitlementsModule],
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule {}
