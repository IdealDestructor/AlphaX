import { IsString, IsOptional, IsNumber, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJournalDto {
  @IsString()
  symbolId: string;

  @IsString()
  side: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  entryPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exitPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  qty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  profit?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  openedAt?: string;

  @IsOptional()
  closedAt?: string;
}

export class UpdateJournalDto {
  @IsOptional()
  @IsString()
  side?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  entryPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exitPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  qty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  profit?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  openedAt?: string;

  @IsOptional()
  closedAt?: string;
}
