import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Enterprise API-key management. Scopes mirror coarse entitlements
 * (`market`, `analysis`, `signals`, `forecast`, `news`). The full key is shown
 * once at creation; only a hash is persisted (`key_hash`).
 */
@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async listKeys(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async createKey(userId: string, name: string, scopes: string[]) {
    const rawKey = `ax_${randomBytes(24).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 10);
    const created = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        keyPrefix,
        keyHash: createHash('sha256').update(rawKey).digest('hex'),
        scopes,
      },
    });
    return {
      id: created.id,
      name: created.name,
      key: rawKey,
      keyPrefix,
      scopes,
      // Only returned this once.
      note: 'Copy this key now — it will not be shown again.',
    };
  }

  async revokeKey(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });
  }
}
