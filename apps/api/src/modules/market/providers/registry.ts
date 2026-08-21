import { Injectable, Logger } from '@nestjs/common';
import type {
  Candle,
  DataSourceStatus,
  MarketDataSource,
  MarketDataProvider,
  ProviderStatus,
  Quote,
} from './market-data.types';
import { MockProvider } from './mock.provider';
import { TickFlowProvider } from './tickflow/tickflow.provider';
import { TICKFLOW_SYMBOL_MAP } from './tickflow/symbol-map';
import { BinanceProvider } from './binance/binance.provider';
import { TreasuryProvider } from './treasury/treasury.provider';
import { TwelveDataProvider } from './twelve-data/twelve-data.provider';

/** 连续失败达到该次数后熔断（跳过该源一段时间） */
const CIRCUIT_THRESHOLD = Number(process.env.MARKET_CIRCUIT_THRESHOLD ?? '3');
/** 熔断冷却时间（ms） */
const CIRCUIT_COOLDOWN_MS = Number(process.env.MARKET_CIRCUIT_COOLDOWN_MS ?? '30000');
/** 同一源相邻两次真实请求的最小间隔（ms），保护免费 API 的串行限流 */
const MIN_REQUEST_INTERVAL_MS = Number(process.env.MARKET_MIN_REQUEST_INTERVAL_MS ?? '400');

/**
 * 行情 Provider 注册表。
 * 优先级: TwelveData(黄金/白银) → Binance(加密) → Treasury(美债) → TickFlow(股票/ETF/指数) → Mock(兜底)。
 * - 免 Key 源 (Binance/Treasury) 默认启用, 可用 *_ENABLED=false 关闭
 * - 需 Key 源 (TickFlow/TwelveData) 未配置 Key 时自动跳过
 * - 健康检查/主备切换：连续失败超过阈值 → 熔断冷却；期间自动切到下一个可用真实源，最后才 mock
 * - 串行限流：同一源相邻请求最小间隔，超频时本次跳过该源（缓存层已进一步降低打到 Provider 的频率）
 */
@Injectable()
export class MarketDataRegistry {
  private readonly logger = new Logger(MarketDataRegistry.name);
  private readonly mock: MockProvider;
  private readonly tickflow: TickFlowProvider | null;
  private readonly twelveData: TwelveDataProvider | null;
  private readonly binance: BinanceProvider | null;
  private readonly treasury: TreasuryProvider | null;

  private readonly lastError: Partial<Record<MarketDataSource, string>> = {};
  private readonly failures: Partial<Record<MarketDataSource, number>> = {};
  private readonly cooldownUntil: Partial<Record<MarketDataSource, number>> = {};
  private readonly lastRequestAt: Partial<Record<MarketDataSource, number>> = {};
  private readonly lastSuccessAt: Partial<Record<MarketDataSource, number>> = {};

  constructor() {
    this.mock = new MockProvider();
    this.tickflow = TickFlowProvider.createIfConfigured();
    this.twelveData = TwelveDataProvider.createIfConfigured();
    this.binance = BinanceProvider.createIfEnabled();
    this.treasury = TreasuryProvider.createIfEnabled();
    for (const p of this.realProviders) {
      this.logger.log(`${p.name} 数据源已启用`);
    }
    if (this.realProviders.length === 0) {
      this.logger.warn('未配置任何真实数据源, 行情将使用内置模拟数据');
    }
  }

  /** 按优先级排列的真实 Provider 列表 */
  private get realProviders(): MarketDataProvider[] {
    const list: (MarketDataProvider | null)[] = [
      this.twelveData,
      this.binance,
      this.treasury,
      this.tickflow,
    ];
    return list.filter((p): p is MarketDataProvider => p !== null);
  }

  private providerFor(source: MarketDataSource): MarketDataProvider | null {
    return this.realProviders.find((p) => p.name === source) ?? null;
  }

  get primarySource(): MarketDataSource {
    return this.realProviders[0]?.name ?? 'mock';
  }

  /** 该源当前是否可用（配置 + 未熔断 + 未超频） */
  private isAvailable(source: MarketDataSource): boolean {
    const provider = this.providerFor(source);
    if (!provider) return false;
    if (this.cooldownUntil[source] && this.cooldownUntil[source] > Date.now()) return false;
    if (this.isRateLimited(source)) return false;
    return true;
  }

  /** 串行限流：距上次真实请求是否小于最小间隔 */
  private isRateLimited(source: MarketDataSource): boolean {
    const last = this.lastRequestAt[source];
    return last !== undefined && Date.now() - last < MIN_REQUEST_INTERVAL_MS;
  }

  /** 熔断后恢复的剩余秒数（0 = 未熔断） */
  private cooldownSeconds(source: MarketDataSource): number {
    const until = this.cooldownUntil[source];
    if (!until) return 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  }

  /** 判断某个 AlphaX 代码实际走哪个源（专用源 → 按优先级找可用源 → mock） */
  sourceFor(symbol: string): MarketDataSource {
    for (const p of this.realProviders) {
      if (this.isAvailable(p.name) && p.canResolve(symbol)) return p.name;
    }
    return 'mock';
  }

  /** 按优先级返回可解析该标的且当前可用的真实源 */
  private availableProvidersFor(symbol: string): MarketDataProvider[] {
    return this.realProviders.filter((p) => this.isAvailable(p.name) && p.canResolve(symbol));
  }

  getStatus(): DataSourceStatus {
    const providers: ProviderStatus[] = this.realProviders.map((p) => {
      const err = this.lastError[p.name] ?? null;
      const lastSuccess = this.lastSuccessAt[p.name];
      return {
        name: p.name,
        configured: p.configured ?? true,
        enabled: true,
        live: this.isAvailable(p.name),
        lastError: err,
        failures: this.failures[p.name] ?? 0,
        cooldownSeconds: this.cooldownSeconds(p.name),
        rateLimited: this.isRateLimited(p.name),
        lastSuccessAt: lastSuccess ? new Date(lastSuccess).toISOString() : null,
      };
    });
    providers.push({
      name: 'mock',
      configured: true,
      enabled: true,
      live: true,
      lastError: null,
      failures: 0,
      cooldownSeconds: 0,
      rateLimited: false,
      lastSuccessAt: null,
    });

    const anyReal = this.realProviders.length > 0;
    return {
      primary: this.primarySource,
      configured: anyReal,
      enabled: anyReal,
      live: providers.some((p) => p.name !== 'mock' && p.live),
      lastError: this.realProviders.map((p) => this.lastError[p.name]).find(Boolean) ?? null,
      symbolMap: { ...TICKFLOW_SYMBOL_MAP },
      sourceBySymbol: {},
      providers,
    };
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    // 按实际数据源分组
    const buckets = new Map<MarketDataSource, string[]>();
    for (const s of symbols) {
      const source = this.sourceFor(s);
      buckets.set(source, [...(buckets.get(source) ?? []), s]);
    }

    const settled = await Promise.all(
      Array.from(buckets.entries()).map(async ([source, syms]) => {
        const provider = this.providerFor(source);
        if (!provider) return this.mock.getQuotes(syms);
        try {
          const quotes = await provider.getQuotes(syms);
          this.recordSuccess(source);
          return quotes;
        } catch (err) {
          const failed: MarketDataSource[] = [source];
          this.recordFailure(source, 'quotes', err);
          // 主备切换：依次尝试其他可解析该批标的的真实源
          for (const next of this.realProviders) {
            if (failed.includes(next.name)) continue;
            const resolvable = syms.every((s) => next.canResolve(s));
            if (!resolvable || !this.isAvailable(next.name)) continue;
            try {
              const quotes = await next.getQuotes(syms);
              this.recordSuccess(next.name);
              return quotes;
            } catch (err2) {
              failed.push(next.name);
              this.recordFailure(next.name, 'quotes-failover', err2);
            }
          }
          return this.mock.getQuotes(syms);
        }
      }),
    );
    return settled.flat();
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    // 主备切换：按优先级依次尝试可解析该标的且可用的真实源
    const candidates = this.availableProvidersFor(symbol);
    for (const provider of candidates) {
      try {
        const candles = await provider.getCandles(symbol, interval, limit);
        if (candles.length > 0) {
          this.recordSuccess(provider.name);
          return candles;
        }
        // 空结果 (如收益率品种分钟级无数据) 也记为一次“可用但无数据”，继续尝试下一源
        this.recordFailure(provider.name, `candles ${symbol} (empty)`, new Error('empty candles'));
      } catch (err) {
        this.recordFailure(provider.name, `candles ${symbol}`, err);
      }
    }
    return this.mock.getCandles(symbol, interval, limit);
  }

  private recordSuccess(source: MarketDataSource): void {
    this.failures[source] = 0;
    this.cooldownUntil[source] = undefined;
    this.lastError[source] = undefined;
    this.lastSuccessAt[source] = Date.now();
    this.lastRequestAt[source] = Date.now();
  }

  private recordFailure(source: MarketDataSource, context: string, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    this.lastError[source] = `${context}: ${message}`;
    this.lastRequestAt[source] = Date.now();
    const count = (this.failures[source] ?? 0) + 1;
    this.failures[source] = count;
    if (count >= CIRCUIT_THRESHOLD) {
      this.cooldownUntil[source] = Date.now() + CIRCUIT_COOLDOWN_MS;
      this.logger.warn(`${source} 连续失败 ${count} 次, 熔断 ${CIRCUIT_COOLDOWN_MS / 1000}s: ${message}`);
    } else {
      this.logger.warn(`${source} ${context} 失败(${count}/${CIRCUIT_THRESHOLD}), 降级/切换: ${message}`);
    }
  }
}

