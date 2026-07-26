import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateJournalDto, UpdateJournalDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private journal: JournalService) {}

  @Get()
  getJournals(
    @CurrentUser('id') userId: string,
    @Query('symbol') symbol?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.journal.getJournals(userId, symbol, limit || 50, offset || 0);
  }

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.journal.getStats(userId);
  }

  @Get(':id')
  getJournal(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.journal.getJournalById(userId, id);
  }

  @Post()
  createJournal(@CurrentUser('id') userId: string, @Body() dto: CreateJournalDto) {
    return this.journal.createJournal(userId, dto);
  }

  @Patch(':id')
  updateJournal(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJournalDto,
  ) {
    return this.journal.updateJournal(userId, id, dto);
  }

  @Delete(':id')
  deleteJournal(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.journal.deleteJournal(userId, id);
  }
}
