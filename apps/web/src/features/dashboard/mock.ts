import type { DashboardData, Direction, Bias, Action, RiskLevel, EvidenceItem } from "./types";
import { getAssetInfo } from "@/lib/assets";

const ASSET_TICKER: Record<string, { price: number; change: number; pct: number }> = {
  XAUUSD: { price: 2384.6, change: 9.9, pct: 0.42 },
  XAGUSD: { price: 28.74, change: -0.05, pct: -0.18 },
  BTCUSD: { price: 67420, change: 824, pct: 1.24 },
  DXY: { price: 104.28, change: -0.11, pct: -0.11 },
  NAS100: { price: 19842, change: 69, pct: 0.35 },
  SPX500: { price: 5432, change: 28, pct: 0.52 },
  WTI: { price: 78.4, change: -0.55, pct: -0.70 },
  BRENT: { price: 82.15, change: -0.45, pct: -0.54 },
  GLD: { price: 218.5, change: 1.8, pct: 0.83 },
  SLV: { price: 26.15, change: 0.22, pct: 0.85 },
  SPY: { price: 545.2, change: 3.1, pct: 0.57 },
};

interface AssetAnalysisProfile {
  trend: Bias;
  action: Action;
  confidence: number;
  riskLevel: RiskLevel;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  reasons: string[];
  evidence: EvidenceItem[];
  sentimentScore: number;
  sentimentLabel: string;
  etfInflow: string;
  cotChange: string;
  longPct: number;
  shortPct: number;
  atr: number;
}

const PROFILES: Record<string, AssetAnalysisProfile> = {
  XAUUSD: {
    trend: "bullish", action: "wait", confidence: 78, riskLevel: "medium",
    entry: "2,378.0 – 2,381.5", stopLoss: "2,364.0", takeProfit: "2,412.0 / 2,428.0",
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
    sentimentScore: 62, sentimentLabel: "偏多 — 机构资金与新闻情绪同步改善，但短线动能过热。",
    etfInflow: "+$412M", cotChange: "+8.2k", longPct: 58, shortPct: 27, atr: 18.4,
  },
  XAGUSD: {
    trend: "bullish", action: "buy", confidence: 68, riskLevel: "medium",
    entry: "28.50 – 28.70", stopLoss: "27.80", takeProfit: "29.80 / 30.50",
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
    sentimentScore: 58, sentimentLabel: "偏多 — 工业需求驱动，但宏观波动仍存。",
    etfInflow: "+$185M", cotChange: "+3.5k", longPct: 55, shortPct: 30, atr: 0.65,
  },
  BTCUSD: {
    trend: "bullish", action: "buy", confidence: 72, riskLevel: "high",
    entry: "66,800 – 67,500", stopLoss: "64,000", takeProfit: "72,000 / 75,000",
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
    sentimentScore: 68, sentimentLabel: "偏多 — 机构买盘强劲，但波动率较高注意风控。",
    etfInflow: "+$680M", cotChange: "N/A", longPct: 62, shortPct: 38, atr: 2450,
  },
  DXY: {
    trend: "bearish", action: "sell", confidence: 65, riskLevel: "medium",
    entry: "104.50 – 104.80", stopLoss: "105.60", takeProfit: "103.00 / 102.50",
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
    sentimentScore: 38, sentimentLabel: "偏空 — 市场一致性预期美元走弱。",
    etfInflow: "N/A", cotChange: "-4.2k", longPct: 32, shortPct: 68, atr: 0.52,
  },
  NAS100: {
    trend: "bullish", action: "buy", confidence: 74, riskLevel: "medium",
    entry: "19,700 – 19,850", stopLoss: "19,200", takeProfit: "20,500 / 21,000",
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
    sentimentScore: 72, sentimentLabel: "偏多 — AI 驱动增长，市场风险偏好良好。",
    etfInflow: "+$3.2B", cotChange: "N/A", longPct: 65, shortPct: 35, atr: 320,
  },
  WTI: {
    trend: "neutral", action: "wait", confidence: 55, riskLevel: "high",
    entry: "77.5 – 79.0", stopLoss: "75.0", takeProfit: "82.5 / 85.0",
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
    sentimentScore: 48, sentimentLabel: "中性 — 多空因素交织，等待方向突破。",
    etfInflow: "+$120M", cotChange: "+1.8k", longPct: 50, shortPct: 50, atr: 2.1,
  },
  GLD: {
    trend: "bullish", action: "buy", confidence: 76, riskLevel: "medium",
    entry: "216.0 – 218.0", stopLoss: "212.0", takeProfit: "224.0 / 228.0",
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
    sentimentScore: 64, sentimentLabel: "偏多 — ETF 资金持续流入，跟踪金价上行。",
    etfInflow: "+$520M", cotChange: "N/A", longPct: 60, shortPct: 40, atr: 3.8,
  },
};

const NEWS: Record<string, { time: string; title: string; tag: string; tagTone: "pos" | "neg" | "neutral"; source: string }[]> = {
  XAUUSD: [
    { time: "16:18", title: "美联储官员放缓降息预期，美元短线承压", tag: "利多金", tagTone: "pos", source: "Reuters · AI 摘要" },
    { time: "15:02", title: "GLD 连续第三日获净申购，ETF 持仓升至四周高位", tag: "资金", tagTone: "pos", source: "Bloomberg" },
    { time: "12:40", title: "中东地缘风险降温，避险溢价部分回吐", tag: "中性偏空", tagTone: "neg", source: "FT" },
    { time: "09:55", title: "中国央行增持黄金传闻再起，实物需求预期升温", tag: "宏观", tagTone: "pos", source: "本地编译" },
  ],
  XAGUSD: [
    { time: "15:30", title: "光伏用银需求 Q2 同比增长 12%，工业需求强劲", tag: "需求", tagTone: "pos", source: "SMM" },
    { time: "13:10", title: "SLV ETF 持仓创三个月新高", tag: "资金", tagTone: "pos", source: "Bloomberg" },
    { time: "11:20", title: "金银比升至 83，历史均值回归空间较大", tag: "比价", tagTone: "pos", source: "MacroMicro" },
  ],
  BTCUSD: [
    { time: "16:45", title: "BTC ETF 单日净流入 $2.1 亿，贝莱德 IBIT 持续领跑", tag: "资金", tagTone: "pos", source: "CoinDesk" },
    { time: "14:20", title: "MicroStrategy 再次增持 1.2 万枚 BTC", tag: "机构", tagTone: "pos", source: "Bloomberg" },
    { time: "10:05", title: "德国政府 BTC 抛售压力消退，市场情绪改善", tag: "供应", tagTone: "pos", source: "The Block" },
    { time: "08:30", title: "链上活跃地址数升至 90 万，网络活跃度回暖", tag: "链上", tagTone: "pos", source: "Glassnode" },
  ],
  DXY: [
    { time: "15:50", title: "美联储 9 月降息概率升至 72%，美元承压", tag: "宏观", tagTone: "neg", source: "Bloomberg" },
    { time: "13:15", title: "美国 Q2 GDP 增速放缓至 1.8%，低于预期", tag: "经济", tagTone: "neg", source: "Reuters" },
    { time: "09:40", title: "欧元区 PMI 超预期回升，EUR/USD 突破 1.09", tag: "外汇", tagTone: "neg", source: "FT" },
  ],
  NAS100: [
    { time: "16:00", title: "NVIDIA Q2 指引超预期，AI 资本开支持续扩张", tag: "科技", tagTone: "pos", source: "Reuters" },
    { time: "13:30", title: "Fed 降息预期升温利好科技成长股估值", tag: "宏观", tagTone: "pos", source: "Bloomberg" },
    { time: "11:00", title: "纳斯达克 100 突破前高，技术面看涨信号", tag: "技术", tagTone: "pos", source: "CNBC" },
  ],
  WTI: [
    { time: "16:20", title: "OPEC+ 维持减产至 Q4，供应收紧预期", tag: "供应", tagTone: "pos", source: "Reuters" },
    { time: "14:00", title: "EIA 原油库存下降 420 万桶，超预期", tag: "库存", tagTone: "pos", source: "EIA" },
    { time: "10:30", title: "中国需求放缓担忧压制油价上行空间", tag: "需求", tagTone: "neg", source: "FT" },
    { time: "08:50", title: "中东停火谈判推进，地缘溢价回落", tag: "地缘", tagTone: "neg", source: "AP" },
  ],
  GLD: [
    { time: "15:40", title: "GLD 单日净申购 12 吨，创近 4 周最大单日流入", tag: "资金", tagTone: "pos", source: "Bloomberg" },
    { time: "13:20", title: "全球黄金 ETF 持仓连续 5 周增长", tag: "趋势", tagTone: "pos", source: "World Gold Council" },
    { time: "09:50", title: "金价突破 $2400 带动 GLD 净值创历史新高", tag: "价格", tagTone: "pos", source: "Reuters" },
  ],
};

const SIGNALS: Record<string, { time: string; symbol: string; side: Action; entry: string; confidence: number; outcome: string; outcomeDirection: Direction }[]> = {
  XAUUSD: [
    { time: "16:20", symbol: "XAUUSD", side: "buy", entry: "2,376.4", confidence: 72, outcome: "进行中", outcomeDirection: "up" },
    { time: "14:05", symbol: "XAUUSD", side: "sell", entry: "2,391.2", confidence: 61, outcome: "止损 −0.4R", outcomeDirection: "down" },
    { time: "11:40", symbol: "XAUUSD", side: "buy", entry: "2,358.0", confidence: 81, outcome: "止盈 +1.6R", outcomeDirection: "up" },
    { time: "09:15", symbol: "XAUUSD", side: "wait", entry: "—", confidence: 54, outcome: "已过期", outcomeDirection: "flat" },
    { time: "昨日", symbol: "XAGUSD", side: "buy", entry: "28.41", confidence: 69, outcome: "止盈 +1.1R", outcomeDirection: "up" },
  ],
  BTCUSD: [
    { time: "15:45", symbol: "BTCUSD", side: "buy", entry: "67,200", confidence: 75, outcome: "进行中", outcomeDirection: "up" },
    { time: "12:30", symbol: "BTCUSD", side: "buy", entry: "65,800", confidence: 71, outcome: "止盈 +0.8R", outcomeDirection: "up" },
    { time: "09:00", symbol: "BTCUSD", side: "sell", entry: "66,500", confidence: 58, outcome: "止损 −0.6R", outcomeDirection: "down" },
    { time: "昨日", symbol: "BTCUSD", side: "buy", entry: "63,200", confidence: 68, outcome: "止盈 +1.4R", outcomeDirection: "up" },
  ],
  NAS100: [
    { time: "14:20", symbol: "NAS100", side: "buy", entry: "19,750", confidence: 76, outcome: "进行中", outcomeDirection: "up" },
    { time: "11:00", symbol: "NAS100", side: "buy", entry: "19,520", confidence: 72, outcome: "止盈 +0.9R", outcomeDirection: "up" },
    { time: "昨日", symbol: "NAS100", side: "buy", entry: "19,100", confidence: 65, outcome: "止盈 +1.2R", outcomeDirection: "up" },
  ],
  WTI: [
    { time: "15:10", symbol: "WTI", side: "wait", entry: "—", confidence: 52, outcome: "进行中", outcomeDirection: "flat" },
    { time: "10:30", symbol: "WTI", side: "sell", entry: "79.80", confidence: 60, outcome: "止盈 +0.7R", outcomeDirection: "down" },
    { time: "昨日", symbol: "WTI", side: "buy", entry: "77.20", confidence: 55, outcome: "止损 −0.5R", outcomeDirection: "down" },
  ],
};

const DEFAULT_TICKER = [
  { symbol: "XAUUSD", price: "2,384.60", change: "▲ +0.42%", direction: "up" as const },
  { symbol: "XAGUSD", price: "28.74", change: "▼ −0.18%", direction: "down" as const },
  { symbol: "DXY", price: "104.28", change: "▼ −0.11%", direction: "down" as const },
  { symbol: "US10Y", price: "4.21%", change: "▲ +2.0bp", direction: "up" as const },
  { symbol: "BTCUSD", price: "67,420", change: "▲ +1.24%", direction: "up" as const },
  { symbol: "VIX", price: "13.8", change: "▼ −0.6", direction: "down" as const },
  { symbol: "NAS100", price: "19,842", change: "▲ +0.35%", direction: "up" as const },
];

function fmtPrice(symbol: string, price: number): string {
  if (symbol === "BTCUSD") return price.toLocaleString("en-US");
  if (["NAS100", "SPX500"].includes(symbol)) return price.toLocaleString("en-US");
  if (["WTI", "BRENT", "XAGUSD"].includes(symbol)) return price.toFixed(2);
  if (["GLD", "SLV", "SPY"].includes(symbol)) return price.toFixed(2);
  return price.toFixed(2);
}

function getThumb(symbol: string): { price: string; change: string; direction: Direction } {
  const t = ASSET_TICKER[symbol];
  if (!t) return { price: "—", change: "—", direction: "flat" };
  const dir: Direction = t.change >= 0 ? "up" : "down";
  const arrow = t.change >= 0 ? "▲" : "▼";
  return {
    price: fmtPrice(symbol, t.price),
    change: `${arrow} ${t.change >= 0 ? "+" : ""}${t.pct.toFixed(2)}%`,
    direction: dir,
  };
}

export function getMockDashboard(symbol: string): DashboardData {
  const info = getAssetInfo(symbol);
  const profile = PROFILES[symbol] ?? PROFILES["XAUUSD"]!;
  const thumb = getThumb(symbol);

  return {
    updatedAt: `更新于 ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`,
    kpi: {
      price: ASSET_TICKER[symbol]?.price ?? 2384.6,
      priceChangeAbs: ASSET_TICKER[symbol]?.change ?? 0,
      priceChangePct: ASSET_TICKER[symbol]?.pct ?? 0,
      confidence: profile.confidence,
      confidenceDelta: Math.round((Math.random() - 0.3) * 12),
      riskLevel: profile.riskLevel,
      atr: profile.atr,
      sentiment: profile.sentimentScore,
      sentimentLabel: profile.sentimentLabel,
    },
    ticker: DEFAULT_TICKER,
    analysis: {
      symbol,
      trend: profile.trend,
      action: profile.action,
      confidence: profile.confidence,
      riskLevel: profile.riskLevel,
      levels: {
        entry: profile.entry,
        stopLoss: profile.stopLoss,
        takeProfit: profile.takeProfit,
      },
      reasons: profile.reasons,
      evidence: profile.evidence,
      updatedAt: `更新 ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`,
      model: "fusion-v2.1",
    },
    signals: SIGNALS[symbol] ?? SIGNALS["XAUUSD"]!,
    sentiment: {
      score: profile.sentimentScore,
      label: profile.sentimentLabel,
      longPct: profile.longPct,
      shortPct: profile.shortPct,
      etfInflow: profile.etfInflow,
      cotChange: profile.cotChange,
      sentimentSource: "mock",
      cotSource: "mock",
    },
    news: NEWS[symbol] ?? NEWS["XAUUSD"]!,
  };
}

