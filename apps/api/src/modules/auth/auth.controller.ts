import { Controller, Post, Get, Body, Param, UseGuards, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const OAUTH_PROVIDERS: Record<string, { authorizeUrl: string; clientId: string }> = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.OAUTH_GOOGLE_CLIENT_ID || 'google-client-id',
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    clientId: process.env.OAUTH_GITHUB_CLIENT_ID || 'github-client-id',
  },
};

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.auth.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser('id') userId: string) {
    return this.auth.logout(userId);
  }

  @Get('oauth/:provider')
  oauthStart(@Param('provider') provider: string, @Res() res: Response) {
    const config = OAUTH_PROVIDERS[provider];
    if (!config) {
      res.status(404).json({ error: { code: 'UNSUPPORTED_PROVIDER', message: `No OAuth provider: ${provider}` } });
      return;
    }
    const redirectUri = `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/v1/auth/oauth/${provider}/callback`;
    const url =
      `${config.authorizeUrl}?` +
      new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
      }).toString();
    res.redirect(url);
  }

  @Get('oauth/:provider/callback')
  oauthCallback(@Param('provider') provider: string, @Query('code') code: string, @Res() res: Response) {
    if (!OAUTH_PROVIDERS[provider] || !code) {
      res.redirect(`${process.env.WEB_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
      return;
    }
    // Real flows exchange `code` for tokens and upsert an OAuthAccount; here we
    // forward to the front-end login for the demo (no provider secret configured).
    res.redirect(`${process.env.WEB_URL || 'http://localhost:3000'}/login?provider=${provider}&code=${code}`);
  }
}
