import { IsOptional, IsString, IsInt, IsArray, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QuoteQuery {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;
    return String(value).split(',').map((symbol) => symbol.trim()).filter(Boolean);
  })
  @IsArray()
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
