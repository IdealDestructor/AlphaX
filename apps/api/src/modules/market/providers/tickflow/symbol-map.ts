/**
 * AlphaX 内部代码 → TickFlow 统一代码 (代码.市场后缀) 映射。
 *
 * TickFlow 支持的市场: SH / SZ / BJ / US / HK / SHF / DCE / ZCE / CFX / INE / GFE。
 * 不支持的品种 (XAUUSD 现货黄金、XAGUSD、BTCUSD、DXY、WTI/BRENT、US10Y 等)
 * 不在映射表中, 会自动回退到内置模拟数据, 避免用错误标的顶替展示。
 *
 * 可通过环境变量 TICKFLOW_SYMBOL_MAP 覆盖/追加, 例如:
 *   TICKFLOW_SYMBOL_MAP='{"XAUUSD":"GC.SHF","NAS100":"NDX.US"}'
 */

const DEFAULT_SYMBOL_MAP: Record<string, string> = {
  // 美股 ETF: 代码与标的一一对应
  GLD: 'GLD.US',
  SLV: 'SLV.US',
  SPY: 'SPY.US',
  // 美股指数: 最佳猜测映射, 失败时自动回退 mock
  NAS100: 'NDX.US', // 纳斯达克100指数
  SPX500: 'SPX.US', // 标普500指数
};

/** TickFlow 已支持的统一代码后缀 (大小写不敏感) */
const TICKFLOW_SUFFIX_RE = /\.(SH|SZ|BJ|US|HK|SHF|DCE|ZCE|CFX|INE|GFE)$/i;

function loadUserMap(): Record<string, string> {
  try {
    const raw = process.env.TICKFLOW_SYMBOL_MAP?.trim();
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) {
        out[key.trim().toUpperCase()] = value.trim().toUpperCase();
      }
    }
    return out;
  } catch {
    return {};
  }
}

export const TICKFLOW_SYMBOL_MAP: Record<string, string> = {
  ...DEFAULT_SYMBOL_MAP,
  ...loadUserMap(),
};

/** 解析 AlphaX 代码 → TickFlow 代码; 无法解析返回 null */
export function resolveTickflowSymbol(code: string): string | null {
  const trimmed = (code ?? '').trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (TICKFLOW_SUFFIX_RE.test(upper)) return upper; // 已是 TickFlow 统一代码
  return TICKFLOW_SYMBOL_MAP[upper] ?? null;
}
