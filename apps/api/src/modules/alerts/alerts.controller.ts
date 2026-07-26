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
import { AlertsService } from './alerts.service';
import { CreateAlertDto, UpdateAlertDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get()
  getAlerts(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.alerts.getAlerts(userId, type, status);
  }

  @Get(':id')
  getAlertById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.alerts.getAlertById(userId, id);
  }

  @Post()
  createAlert(@CurrentUser('id') userId: string, @Body() dto: CreateAlertDto) {
    return this.alerts.createAlert(userId, dto);
  }

  @Patch(':id')
  updateAlert(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alerts.updateAlert(userId, id, dto);
  }

  @Delete(':id')
  deleteAlert(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.alerts.deleteAlert(userId, id);
  }
}
