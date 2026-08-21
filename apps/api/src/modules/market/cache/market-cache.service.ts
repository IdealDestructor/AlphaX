import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * 进程内 TTL 缓存（P0 过渡方案，正式版换 Redis）。
 *
 * 用途：行情类数据短 TTL 缓存，避免每次请求都打到 Provider / 外部 API。
 * - quotes 建议 5–15s，candles 建议 30–60s
 * - 内存上限按条目数限制（LRU 近似：超限时清掉过期项，仍超限则整体清空兜底）
 */
@Injectable()
export class MarketCacheService {
  private readonly logger = new Logger(MarketCacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;

  constructor() {
    const parsed = Number(process.env.MARKET_CACHE_MAX_ENTRIES ?? '500');
    this.maxEntries = Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.evictExpired();
    if (this.store.size >= this.maxEntries) {
      // 简单兜底：先清过期，仍满则整体清空（避免内存无限增长）
      this.store.clear();
      this.logger.warn('market cache 达到上限，已整体清空');
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** 命中率统计（便于观察过渡期效果） */
  stats() {
    return { size: this.store.size, maxEntries: this.maxEntries };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }
}
