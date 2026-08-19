/** 数据源标识: tickflow/twelve-data/binance/treasury = 真实行情, mock = 内置模拟数据兜底 */
export type MarketDataSource = 'tickflow' | 'twelve-data' | 'binance' | 'treasury' | 'mock';

/** 真实数据源 (按优先级排列, 用于路由与状态展示) */
export const REAL_SOURCES: MarketDataSource[] = ['twelve-data', 'binance', 'treasury', 'tickflow'];

/** 数据源展示名 */
export const SOURCE_LABELS: Record<MarketDataSource, string> = {
  tickflow: 'TickFlow',
  'twelve-data': 'TwelveData',
  binance: 'Binance',
  treasury: 'US Treasury',
  mock: '模拟数据',
};

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  timestamp: string;
  /** 本条行情实际来自哪个数据源 */
  source: MarketDataSource;
}

export interface Candle {
  /** Unix 秒 */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** 行情数据源统一接口: AlphaX 内部代码进出, provider 负责映射与归一化 */
export interface MarketDataProvider {
  readonly name: MarketDataSource;
  /** 是否已配置 (免 Key 源恒为 true) */
  readonly configured?: boolean;
  /** 该 provider 是否能解析此 AlphaX 代码 */
  canResolve(symbol: string): boolean;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getCandles(symbol: string, interval: string, limit: number): Promise<Candle[]>;
}

/** 单个 Provider 的健康状态 */
export interface ProviderStatus {
  name: MarketDataSource;
  configured: boolean;
  enabled: boolean;
  live: boolean;
  lastError: string | null;
}

export interface DataSourceStatus {
  primary: MarketDataSource;
  configured: boolean;
  enabled: boolean;
  live: boolean;
  lastError: string | null;
  /** AlphaX 代码 → TickFlow 统一代码 */
  symbolMap: Record<string, string>;
  /** 每个 AlphaX 代码实际走哪个数据源 */
  sourceBySymbol: Record<string, MarketDataSource>;
  /** 各 Provider 的配置与健康状态 */
  providers: ProviderStatus[];
}

