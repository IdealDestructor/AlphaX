import { IsString, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  symbol?: string;
}

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  symbol?: string;
}
