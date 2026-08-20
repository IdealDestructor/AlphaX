import { IsIn, IsString, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsIn(['pro', 'enterprise'])
  plan: 'pro' | 'enterprise';
}

export class LicenseActivateDto {
  @IsString()
  @MinLength(8)
  licenseKey: string;
}
