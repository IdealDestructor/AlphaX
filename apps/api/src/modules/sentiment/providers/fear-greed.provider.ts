import { Injectable, Logger } from '@nestjs/common';

/**
 * CNN Fear & Greed Index 真实市场情绪 Provider。
 *
 * 数据源：CNN Business 官方公开 JSON（免费、无 Key）：
 *   https://production.dataviz.cnn.io/index/fearandgreed/graphdata
 * 返回 0–100 的市场情绪分：0=极度恐慌，50=中性，100=极度贪婪。
 * 说明：本环境无外网无法实测，失败时调用方降级（source 标注 'mock'），绝不编造。
 */

export interface FearGreedSnapshot {
  value: number; // 0–100
  rating: string; // 如 Extreme Greed / Fear / Neutral
  previousClose: number | null;
  updatedAt: string;
}

const DEFAULT_URL = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
const TTL_MS = 15 * 60 * 1000;

@Injectable()
export class FearGreedProvider {
  private readonly logger = new Logger(FearGreedProvider.name);
  private cache: FearGreedSnapshot | null = null;
  private cacheExpiresAt = 0;

  async getSnapshot(): Promise<FearGreedSnapshot | null> {
    if (this.cache && this.cacheExpiresAt > Date.now()) return this.cache;

    const url = process.env.CNN_FEAR_GREED_URL ?? DEFAULT_URL;
    try {
      const json = await this.fetchJson(url);
      const fg = json?.fear_and_greed as Record<string, unknown> | undefined;
      const value = num(fg?.now_value);
      if (value == null) {
        this.logger.warn('CNN Fear & Greed 响应缺少 now_value');
        return null;
      }
      const snapshot: FearGreedSnapshot = {
        value,
        rating: typeof fg?.rating === 'string' ? fg.rating : 'Unknown',
        previousClose: num(fg?.previous_close),
        updatedAt: new Date().toISOString(),
      };
      this.cache = snapshot;
      this.cacheExpiresAt = Date.now() + TTL_MS;
      this.logger.log(`CNN Fear & Greed: ${value} (${snapshot.rating})`);
      return snapshot;
    } catch (err) {
      this.logger.warn(`CNN Fear & Greed 拉取失败: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  private async fetchJson(url: string): Promise<Record<string, unknown> | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlphaX/0.1)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as unknown;
      return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    } finally {
      clearTimeout(timer);
    }
  }
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
