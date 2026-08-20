import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto';

/** 统一的认证响应：token 对 + 用户资料。 */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    plan: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_TAKEN', message: '该邮箱已注册，请直接登录' });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName?.trim() || email.split('@')[0],
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' });
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' });
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshDto): Promise<AuthResult> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: '登录已过期，请重新登录' });
    }

    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(token.user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: '用户不存在或已注销' });
    }
    const { passwordHash, ...profile } = user;
    return profile;
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    displayName: string | null;
    plan: string;
    role: string;
  }): Promise<AuthResult> {
    const payload = { sub: user.id, email: user.email };

    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || '900', 10);
    const accessToken = this.jwt.sign(payload, { expiresIn });

    const refreshTokenValue = uuid();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: new Date(
          Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800', 10) * 1000),
        ),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        plan: user.plan,
        role: user.role,
      },
    };
  }
}
