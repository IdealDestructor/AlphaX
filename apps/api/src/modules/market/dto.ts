import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteQuery {
  @IsOptional()
  @IsString({ each: true })
  symbols?: string[];
}

export class CandleQuery {
  @IsString()
  symbol: string;

  @IsOptional()
  @IsString()
  interval?: string = '1h';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}

export class IndicatorsQuery {
  @IsString()
  symbol: string;

  @IsOptional()
  @IsString()
  interval?: string = '1h';

  @IsOptional()
  @IsString({ each: true })
  indicators?: string[];
}
