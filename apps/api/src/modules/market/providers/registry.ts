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

/**
 * 行情 Provider 注册表。
 * 优先级: TwelveData(黄金/白银) → Binance(加密) → Treasury(美债) → TickFlow(股票/ETF/指数) → Mock(兜底)。
 * - 免 Key 源 (Binance/Treasury) 默认启用, 可用 *_ENABLED=false 关闭
 * - 需 Key 源 (TickFlow/TwelveData) 未配置 Key 时自动跳过
 * - 每个真实源失败都会记录, 供 /market/data-source 状态接口展示; 该源标的自动降级 mock
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

  /** 判断某个 AlphaX 代码实际走哪个源 (专用源 → TickFlow → mock) */
  sourceFor(symbol: string): MarketDataSource {
    for (const p of this.realProviders) {
      if (p.canResolve(symbol)) return p.name;
    }
    return 'mock';
  }

  getStatus(): DataSourceStatus {
    const providers: ProviderStatus[] = this.realProviders.map((p) => {
      const err = this.lastError[p.name] ?? null;
      return {
        name: p.name,
        configured: p.configured ?? true,
        enabled: true,
        live: err === null,
        lastError: err,
      };
    });
    providers.push({ name: 'mock', configured: true, enabled: true, live: true, lastError: null });

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

    const result: Quote[] = [];
    for (const [source, syms] of buckets) {
      const provider = this.providerFor(source);
      if (!provider) {
        result.push(...(await this.mock.getQuotes(syms)));
        continue;
      }
      try {
        const quotes = await provider.getQuotes(syms);
        this.lastError[source] = undefined;
        result.push(...quotes);
      } catch (err) {
        this.recordFailure(source, 'quotes', err);
        result.push(...(await this.mock.getQuotes(syms)));
      }
    }
    return result;
  }

  async getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    const source = this.sourceFor(symbol);
    const provider = this.providerFor(source);
    if (provider) {
      try {
        const candles = await provider.getCandles(symbol, interval, limit);
        if (candles.length > 0) {
          this.lastError[source] = undefined;
          return candles;
        }
        // 空结果 (如收益率品种分钟级无数据) 走降级, 保持现状行为
      } catch (err) {
        this.recordFailure(source, `candles ${symbol}`, err);
      }
    }
    return this.mock.getCandles(symbol, interval, limit);
  }

  private recordFailure(source: MarketDataSource, context: string, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    this.lastError[source] = `${context}: ${message}`;
    this.logger.warn(`${source} ${context} 失败, 降级 mock: ${message}`);
  }
}

