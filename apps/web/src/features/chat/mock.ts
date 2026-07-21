import type { ChatSession, ChatPageData } from "./types";

const now = new Date();

function minutesAgo(n: number): string {
  return new Date(now.getTime() - n * 60000).toISOString();
}

export const chatSessions: ChatSession[] = [
  {
    id: "sess_001",
    title: "XAUUSD 今日走势分析",
    symbol: "XAUUSD",
    model: "fusion-v2.1",
    messageCount: 4,
    createdAt: minutesAgo(120),
    updatedAt: minutesAgo(45),
    messages: [
      {
        id: "m_001",
        role: "user",
        content: "黄金今天怎么看？能买吗？",
        timestamp: minutesAgo(120),
      },
      {
        id: "m_002",
        role: "assistant",
        content:
          "综合多 Agent 分析，当前 XAUUSD 呈偏多结构，但建议等待回踩而非追高。\n\n**核心逻辑：**\n• 4H 级别价格站稳 EMA20/50，HH/HL 结构完整，Market Agent 给正分\n• DXY 回落 + 美债收益率企稳，宏观压力缓解，Macro Agent 确认支撑\n• GLD ETF 连续 3 日净流入，Smart Money Agent 信号偏多\n• 但 RSI 接近 67，短线动能过热，Indicator Agent 提示回调风险\n\n**建议动作：** 等待 → 入场区间 2,378–2,381.5，止损 2,364，目标 2,412 / 2,428",
        timestamp: minutesAgo(119),
        tokens: 245,
        model: "fusion-v2.1",
        sources: [
          { agent: "Market Agent", signal: "HH/HL 结构完整", weight: 0.32 },
          { agent: "Macro Agent", signal: "DXY 回落", weight: 0.24 },
          { agent: "Smart Money Agent", signal: "GLD ETF 净流入", weight: 0.22 },
          { agent: "Sentiment Agent", signal: "新闻 NLP 偏多", weight: 0.14 },
          { agent: "Indicator Agent", signal: "RSI 超买警告", weight: 0.08 },
        ],
      },
      {
        id: "m_003",
        role: "user",
        content: "止损放哪比较合适？",
        timestamp: minutesAgo(60),
      },
      {
        id: "m_004",
        role: "assistant",
        content:
          "基于 Risk Agent 评估：\n\n**建议止损位置：2,364.0**\n\n理由：\n• 该位置位于近期摆动低点下方约 0.5ATR（ATR=18.4），具备技术合理性\n• 若跌破 2,364，4H 结构将转为高点更低（LH），多头逻辑失效\n• RSI 回调至 50 附近可考虑减仓或移动止损至成本价\n• 当前风险等级：中，建议仓位不超过常规 60%\n\n如果风险偏好较低，可考虑 2,370 作为追踪止损的第一档。",
        timestamp: minutesAgo(59),
        tokens: 188,
        model: "fusion-v2.1",
        sources: [
          { agent: "Risk Agent", signal: "ATR 止损建议", weight: 0.35 },
          { agent: "Market Agent", signal: "结构关键位", weight: 0.28 },
        ],
      },
    ],
  },
  {
    id: "sess_002",
    title: "美元指数对黄金的影响",
    symbol: "XAUUSD",
    model: "fusion-v2.1",
    messageCount: 2,
    createdAt: minutesAgo(240),
    updatedAt: minutesAgo(230),
    messages: [
      {
        id: "m_005",
        role: "user",
        content: "最近 DXY 下跌对黄金有什么影响？",
        timestamp: minutesAgo(240),
      },
      {
        id: "m_006",
        role: "assistant",
        content:
          "DXY 与 XAUUSD 整体呈负相关，近期影响如下：\n\n**Macro Agent 分析：**\n• DXY 从 105.2 回落至 104.3（−0.9%），对应黄金从 2,358 反弹至 2,384\n• 美债实际收益率同步走低，实际利率下降进一步支撑金价\n• 美联储降息预期重新计价：市场定价 9 月降息概率升至 72%\n\n**Smart Money Agent 信号：**\n• COMEX 黄金期货净多头增加 8.2k 手\n• 央行购金趋势延续（中国连续 5 个月增持）\n\n需关注的风险：若 DXY 在 104 整数关口获得支撑反弹，黄金多头逻辑将短期承压。",
        timestamp: minutesAgo(239),
        tokens: 215,
        model: "fusion-v2.1",
        sources: [
          { agent: "Macro Agent", signal: "DXY 下行趋势", weight: 0.36 },
          { agent: "Smart Money Agent", signal: "COT 净多增", weight: 0.24 },
          { agent: "Risk Agent", signal: "104 支撑风险", weight: 0.18 },
        ],
      },
    ],
  },
  {
    id: "sess_003",
    title: "本周风险事件提醒",
    symbol: "XAUUSD",
    model: "fusion-v2.1",
    messageCount: 3,
    createdAt: minutesAgo(480),
    updatedAt: minutesAgo(360),
    messages: [
      {
        id: "m_007",
        role: "user",
        content: "这周有什么重要的风险事件？",
        timestamp: minutesAgo(480),
      },
      {
        id: "m_008",
        role: "assistant",
        content:
          "本周重点关注以下事件（Risk Agent 监控）：\n\n**高风险事件：**\n1. **周四 20:30 美国 CPI 数据** — 预期核心 CPI 环比 +0.2%，若超预期将打压降息预期\n2. **周五 22:00 密歇根消费者信心指数** — 影响美元短期走势\n\n**中风险事件：**\n3. 美联储官员讲话（周二/周三共 4 场）— 可能释放政策信号\n4. 中东地缘局势演变 — 当前溢价部分回吐，但仍有反复可能\n\n**建议：** CPI 公布前 30 分钟减少敞口，避免数据市双向扫损。",
        timestamp: minutesAgo(479),
        tokens: 195,
        model: "fusion-v2.1",
        sources: [
          { agent: "Risk Agent", signal: "CPI 事件警报", weight: 0.40 },
          { agent: "Macro Agent", signal: "降息预期波动", weight: 0.25 },
          { agent: "News Agent", signal: "地缘风险", weight: 0.18 },
        ],
      },
      {
        id: "m_009",
        role: "user",
        content: "CPI 预期具体是多少？",
        timestamp: minutesAgo(420),
      },
      {
        id: "m_010",
        role: "assistant",
        content:
          "本月 CPI 预期（Bloomberg 一致预期）：\n\n• **名义 CPI 环比：** +0.1%（前值 +0.0%）\n• **核心 CPI 环比：** +0.2%（前值 +0.2%）\n• **名义 CPI 同比：** +3.4%（前值 +3.3%）\n• **核心 CPI 同比：** +3.5%（前值 +3.6%）\n\n若实际值 ≤ 预期，美元可能短线承压，利好黄金；\n若实际值 ≥ 预期，美元反弹，黄金可能回调测试 2,365–2,370 支撑。\n\n*数据来源：Bloomberg 共识预测，实际以 BLS 发布为准。*",
        timestamp: minutesAgo(419),
        tokens: 172,
        model: "fusion-v2.1",
        sources: [
          { agent: "Macro Agent", signal: "CPI 预期数据", weight: 0.35 },
          { agent: "News Agent", signal: "Bloomberg 一致预期", weight: 0.22 },
        ],
      },
    ],
  },
];

export const chatPageDataMock: ChatPageData = {
  sessions: chatSessions,
  currentSessionId: "sess_001",
};
