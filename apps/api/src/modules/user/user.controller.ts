import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto, UpdatePasswordDto, UpdateSettingsDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private user: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser('id') userId: string) {
    return this.user.getProfile(userId);
  }

  @Patch('profile')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.user.updateProfile(userId, dto);
  }

  @Post('password')
  updatePassword(@CurrentUser('id') userId: string, @Body() dto: UpdatePasswordDto) {
    return this.user.updatePassword(userId, dto.oldPassword, dto.newPassword);
  }

  @Get('watchlist')
  getWatchlist(@CurrentUser('id') userId: string) {
    return this.user.getWatchlist(userId);
  }

  @Post('watchlist')
  addWatchlist(@CurrentUser('id') userId: string, @Body('symbol') symbol: string) {
    return this.user.addWatchlist(userId, symbol);
  }

  @Delete('watchlist/:symbol')
  removeWatchlist(@CurrentUser('id') userId: string, @Param('symbol') symbol: string) {
    return this.user.removeWatchlist(userId, symbol);
  }

  @Get('settings')
  getSettings(@CurrentUser('id') userId: string) {
    return this.user.getSettings(userId);
  }

  @Patch('settings')
  updateSettings(@CurrentUser('id') userId: string, @Body() dto: UpdateSettingsDto) {
    return this.user.updateSettings(userId, dto);
  }
}
