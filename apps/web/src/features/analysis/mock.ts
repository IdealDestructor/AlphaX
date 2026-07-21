import type { AnalysisEntry, AnalysisPageData, AccuracySummary, Timeframe } from "./types";
import { getAssetInfo } from "@/lib/assets";

const NOW = Math.floor(Date.now() / 1000);

const ASSET_PROFILES: Record<string, {
  trend: AnalysisEntry["trend"];
  action: AnalysisEntry["action"];
  conf: number;
  reasons: string[];
  evidence: { source: string; signal: string; weight: number }[];
}> = {
  XAUUSD: {
    trend: "bullish", action: "wait", conf: 78,
    reasons: [
      "4H 站稳 EMA20/50，结构仍为更高低点",
      "DXY 回落 + 美债收益率企稳，美元压力缓解",
      "GLD ETF 连续 3 日净流入，Smart Money 偏多",
      "短线 RSI 超买，优先等回踩再入场，而非追高",
    ],
    evidence: [
      { source: "技术结构 · 4H", signal: "HH/HL", weight: 0.32 },
      { source: "宏观 · DXY / US10Y", signal: "美元弱", weight: 0.24 },
      { source: "资金 · GLD ETF", signal: "净流入", weight: 0.22 },
      { source: "情绪 · 新闻 NLP", signal: "偏多", weight: 0.14 },
      { source: "动量 · RSI/MACD", signal: "过热", weight: 0.08 },
    ],
  },
  XAGUSD: {
    trend: "bullish", action: "buy", conf: 68,
    reasons: [
      "白银工业需求预期升温，光伏用银持续增长",
      "金银比处于高位，均值回归利好白银",
      "SLV ETF 持仓连续增加，资金持续流入",
      "COMEX 白银期货净多头回升",
    ],
    evidence: [
      { source: "技术结构 · 日线", signal: "上升通道", weight: 0.30 },
      { source: "供需 · 工业需求", signal: "光伏+", weight: 0.25 },
      { source: "资金 · SLV ETF", signal: "净流入", weight: 0.20 },
      { source: "比价 · 金银比", signal: "均值回归", weight: 0.15 },
      { source: "动量 · RSI", signal: "中性偏多", weight: 0.10 },
    ],
  },
  BTCUSD: {
    trend: "bullish", action: "buy", conf: 72,
    reasons: [
      "BTC ETF 连续 5 日净流入，机构资金加速入场",
      "减半后供应紧缩效应逐步显现",
      "链上活跃地址数回升，网络基本面改善",
      "美联储降息预期推动风险资产偏好回升",
    ],
    evidence: [
      { source: "资金 · BTC ETF", signal: "净流入 $680M", weight: 0.30 },
      { source: "链上 · 活跃地址", signal: "持续回升", weight: 0.22 },
      { source: "宏观 · 降息预期", signal: "风险偏好升", weight: 0.20 },
      { source: "技术 · 日线结构", signal: "更高高低", weight: 0.18 },
      { source: "情绪 · 贪婪指数", signal: "62 · 温和贪婪", weight: 0.10 },
    ],
  },
  DXY: {
    trend: "bearish", action: "sell", conf: 65,
    reasons: [
      "美联储鸽派倾向增强，降息预期压制美元",
      "欧元区经济企稳，EUR/USD 反弹施压 DXY",
      "美债收益率曲线陡化，短端利率下行",
      "技术面跌破 104.5 支撑，趋势转弱",
    ],
    evidence: [
      { source: "宏观 · 美联储", signal: "鸽派预期", weight: 0.28 },
      { source: "技术 · 日线", signal: "支撑破位", weight: 0.24 },
      { source: "利率 · US10Y", signal: "收益率下行", weight: 0.22 },
      { source: "外汇 · EUR/USD", signal: "欧元反弹", weight: 0.16 },
      { source: "CFTC · 持仓", signal: "美元多头减仓", weight: 0.10 },
    ],
  },
  NAS100: {
    trend: "bullish", action: "buy", conf: 74,
    reasons: [
      "AI 产业资本开支超预期，科技股盈利上修",
      "美联储降息预期支撑成长股估值",
      "纳斯达克 100 技术面突破前高",
      "QQQ ETF 资金持续净流入",
    ],
    evidence: [
      { source: "基本面 · AI 资本开支", signal: "超预期", weight: 0.28 },
      { source: "宏观 · 利率预期", signal: "降息利好成长", weight: 0.22 },
      { source: "技术 · 日线", signal: "突破前高", weight: 0.20 },
      { source: "资金 · QQQ ETF", signal: "净流入 +$3.2B", weight: 0.18 },
      { source: "情绪 · VIX", signal: "低位 13.8", weight: 0.12 },
    ],
  },
  SPX500: {
    trend: "bullish", action: "buy", conf: 71,
    reasons: [
      "标普 500 盈利增长超预期，科技 + 金融双轮驱动",
      "美联储降息预期提振市场估值",
      "企业回购规模创历史新高",
      "SPY ETF 资金连续 6 周净流入",
    ],
    evidence: [
      { source: "基本面 · 盈利", signal: "Q2 增长 +8%", weight: 0.28 },
      { source: "宏观 · 降息预期", signal: "估值支撑", weight: 0.22 },
      { source: "资金 · SPY ETF", signal: "净流入 +$4.1B", weight: 0.20 },
      { source: "技术 · 周线", signal: "上升趋势", weight: 0.18 },
      { source: "情绪 · AAII", signal: "看多 48%", weight: 0.12 },
    ],
  },
  WTI: {
    trend: "neutral", action: "wait", conf: 55,
    reasons: [
      "OPEC+ 减产执行率较高，供应端偏紧",
      "全球经济放缓担忧压制需求预期",
      "EIA 库存数据连续 2 周下降",
      "中东地缘风险溢价回落，多空拉锯",
    ],
    evidence: [
      { source: "供需 · OPEC+", signal: "减产执行", weight: 0.26 },
      { source: "宏观 · 需求", signal: "经济放缓", weight: 0.24 },
      { source: "库存 · EIA", signal: "库存下降", weight: 0.20 },
      { source: "地缘 · 中东", signal: "风险溢价回落", weight: 0.16 },
      { source: "技术 · 日线", signal: "区间震荡", weight: 0.14 },
    ],
  },
  BRENT: {
    trend: "neutral", action: "wait", conf: 53,
    reasons: [
      "布伦特与 WTI 价差收窄，全球供需平衡偏松",
      "OPEC+ 减产协议延长至 Q4 提供支撑",
      "欧洲需求复苏缓慢，上行空间受限",
      "技术面 80-85 区间震荡，等待突破",
    ],
    evidence: [
      { source: "供需 · OPEC+", signal: "减产延长", weight: 0.26 },
      { source: "宏观 · 欧洲需求", signal: "复苏缓慢", weight: 0.24 },
      { source: "价差 · WTI", signal: "价差收窄", weight: 0.20 },
      { source: "技术 · 日线", signal: "区间震荡", weight: 0.18 },
      { source: "地缘 · 中东", signal: "风险溢价回落", weight: 0.12 },
    ],
  },
  GLD: {
    trend: "bullish", action: "buy", conf: 76,
    reasons: [
      "GLD 连续 4 日净申购，实物黄金需求强劲",
      "金价上行带动 ETF 净值增长",
      "美元走弱利好黄金计价资产",
      "美联储降息周期预期支撑贵金属整体",
    ],
    evidence: [
      { source: "资金 · 申购数据", signal: "连续净流入", weight: 0.32 },
      { source: "关联 · XAUUSD", signal: "金价上行", weight: 0.26 },
      { source: "宏观 · 美元", signal: "美元走弱", weight: 0.22 },
      { source: "利率 · 实际利率", signal: "下行趋势", weight: 0.20 },
    ],
  },
  SLV: {
    trend: "bullish", action: "buy", conf: 66,
    reasons: [
      "SLV 连续 2 周净申购，白银实物需求旺盛",
      "光伏产业用银量同比增长 15%",
      "金银比高位回落预期利好白银",
      "白银价格突破关键阻力位",
    ],
    evidence: [
      { source: "资金 · SLV ETF", signal: "净流入 +$320M", weight: 0.30 },
      { source: "供需 · 工业需求", signal: "光伏用银+", weight: 0.25 },
      { source: "比价 · 金银比", signal: "高位 83", weight: 0.22 },
      { source: "技术 · 日线", signal: "突破阻力", weight: 0.23 },
    ],
  },
  SPY: {
    trend: "bullish", action: "buy", conf: 72,
    reasons: [
      "SPY 追踪标普 500，受益于美国经济韧性",
      "美联储降息预期支撑权益资产",
      "企业回购与分红增长提供稳定回报",
      "期权市场波动率偏低，市场情绪稳定",
    ],
    evidence: [
      { source: "宏观 · 美国经济", signal: "软着陆预期", weight: 0.28 },
      { source: "资金 · ETF 流入", signal: "连续净流入", weight: 0.25 },
      { source: "技术 · 周线", signal: "上升趋势", weight: 0.24 },
      { source: "情绪 · VIX", signal: "13.8 低位", weight: 0.23 },
    ],
  },
};

const DEFAULT_REASONS = ["技术面结构偏多", "RSI 金叉确认", "DXY 趋势配合"];

function entry(
  id: string,
  tf: Timeframe,
  symbol: string,
  profile: { trend: AnalysisEntry["trend"]; action: AnalysisEntry["action"]; conf: number; reasons: string[]; evidence: { source: string; signal: string; weight: number }[] },
  agoHours: number,
  outcome?: AnalysisEntry["outcome"],
): AnalysisEntry {
  const ago = NOW - agoHours * 3600;
  const base: Omit<AnalysisEntry, "outcome"> = {
    id,
    symbol,
    timeframe: tf,
    trend: profile.trend,
    action: profile.action,
    confidence: profile.conf,
    riskLevel: profile.conf > 70 ? "medium" : profile.conf > 50 ? "medium" : "high",
    levels: {
      entry: "—",
      stopLoss: "—",
      takeProfit: "—",
    },
    reasons: profile.reasons.slice(0, 2),
    evidence: profile.evidence.slice(0, 3),
    model: "fusion-v2.1",
    sourceAgent: "coordinator",
    createdAt: new Date((ago - 600) * 1000).toISOString(),
    updatedAt: new Date(ago * 1000).toISOString(),
  };
  return outcome ? { ...base, outcome } : base;
}

export function fetchMockAnalysis(symbol: string): AnalysisPageData {
  const info = getAssetInfo(symbol);
  const profile = ASSET_PROFILES[symbol] ?? ASSET_PROFILES["XAUUSD"]!;

  const historyEntries: AnalysisEntry[] = [
    entry("a001", "4H", symbol, profile, 26, { result: "hit_tp", pnlR: 1.8, pnlPct: 0.9 }),
    entry("a002", "1H", symbol, profile, 20, { result: "hit_tp", pnlR: 0.6, pnlPct: 0.3 }),
    entry("a003", "4H", symbol, profile, 14, { result: "hit_sl", pnlR: -0.8, pnlPct: -0.4 }),
    entry("a004", "1H", symbol, profile, 8, { result: "hit_tp", pnlR: 1.2, pnlPct: 0.6 }),
    entry("a005", "15m", symbol, { trend: "neutral", action: "wait", conf: 55, reasons: DEFAULT_REASONS, evidence: [{ source: "技术 · 15m", signal: "震荡", weight: 0.5 }] }, 4, { result: "expired" }),
    entry("a006", "1H", symbol, profile, 2, { result: "pending" }),
  ];

  const currentEntry: AnalysisEntry = {
    ...entry("a007", "4H", symbol, profile, 0),
    reasons: profile.reasons,
    evidence: profile.evidence,
  };

  const accuracy: AccuracySummary = {
    total: 47,
    win: 31,
    loss: 16,
    winRate: 0.66,
    avgR: 0.92,
    byTimeframe: {
      "15m": { total: 12, win: 7, winRate: 0.58 },
      "1H": { total: 18, win: 12, winRate: 0.67 },
      "4H": { total: 14, win: 10, winRate: 0.71 },
      "1D": { total: 3, win: 2, winRate: 0.67 },
    },
  };

  return {
    symbol,
    current: { ...currentEntry, symbol },
    history: historyEntries,
    accuracy,
    availableTimeframes: ["15m", "1H", "4H", "1D"],
    updatedAt: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
  };
}
