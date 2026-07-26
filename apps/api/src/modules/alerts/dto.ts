import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  symbolId?: string;

  @IsOptional()
  condition?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateAlertDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  symbolId?: string;

  @IsOptional()
  condition?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
