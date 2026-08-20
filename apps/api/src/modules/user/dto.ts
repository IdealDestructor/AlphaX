import {
  IsString,
  IsOptional,
  MinLength,
  IsEmail,
  IsObject,
  IsIn,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdatePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(['USD', 'CNY', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD'])
  currency?: string;

  @IsOptional()
  @IsIn(['international', 'chinese'])
  colorScheme?: string;

  @IsOptional()
  @IsObject()
  notifications?: Record<string, any>;
}
