import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PositionCalculatorDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  balance: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  riskPercent: number;

  @Type(() => Number)
  @IsNumber()
  entry: number;

  @Type(() => Number)
  @IsNumber()
  stopLoss: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  takeProfit?: number;

  @IsOptional()
  @IsString()
  symbol?: string;
}
