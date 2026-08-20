import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear old seed data
  await prisma.journal.deleteMany({ where: { user: { email: 'demo@alphax.com' } } });
  await prisma.watchlist.deleteMany({ where: { user: { email: 'demo@alphax.com' } } });
  await prisma.forecast.deleteMany();
  await prisma.aiAnalysis.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.news.deleteMany();

  // Create symbols
  const symbolsData = [
    { code: 'XAUUSD', name: '黄金/美元', assetClass: 'commodity', tickSize: 0.01 },
    { code: 'XAGUSD', name: '白银/美元', assetClass: 'commodity', tickSize: 0.001 },
    { code: 'BTCUSD', name: '比特币/美元', assetClass: 'crypto', tickSize: 0.1 },
    { code: 'DXY', name: '美元指数', assetClass: 'index', tickSize: 0.01 },
    { code: 'NAS100', name: '纳斯达克100指数', assetClass: 'index', tickSize: 0.1 },
    { code: 'SPX500', name: '标普500指数', assetClass: 'index', tickSize: 0.1 },
    { code: 'WTI', name: 'WTI原油', assetClass: 'commodity', tickSize: 0.01 },
    { code: 'BRENT', name: '布伦特原油', assetClass: 'commodity', tickSize: 0.01 },
    { code: 'GLD', name: 'SPDR黄金ETF', assetClass: 'etf', tickSize: 0.01 },
    { code: 'SLV', name: 'iShares白银ETF', assetClass: 'etf', tickSize: 0.01 },
    { code: 'SPY', name: 'SPDR标普500ETF', assetClass: 'etf', tickSize: 0.01 },
    { code: 'US10Y', name: '美国10年期国债收益率', assetClass: 'bond', tickSize: 0.001 },
  ];

  const symbolMap: Record<string, string> = {};
  for (const s of symbolsData) {
    const created = await prisma.symbol.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    symbolMap[s.code] = created.id;
  }

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@alphax.com' },
    update: {
      displayName: 'Demo User',
      plan: 'pro',
      currency: 'USD',
      colorScheme: 'international',
      notifications: {
        priceAlerts: { email: true, webPush: true, telegram: false },
        aiSignals: { email: true, webPush: false, telegram: false },
        newsAlerts: { email: false, webPush: true, telegram: false },
        systemUpdates: true,
      },
    },
    create: {
      email: 'demo@alphax.com',
      passwordHash,
      displayName: 'Demo User',
      role: 'user',
      plan: 'pro',
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
      currency: 'USD',
      colorScheme: 'international',
      notifications: {
        priceAlerts: { email: true, webPush: true, telegram: false },
        aiSignals: { email: true, webPush: false, telegram: false },
        newsAlerts: { email: false, webPush: true, telegram: false },
        systemUpdates: true,
      },
    },
  });

  // Seed news
  const newsItems = [
    { source: 'reuters', title: '美联储维持利率不变，黄金价格持稳', impact: 'high', summary: '美联储在最新会议上决定维持利率不变，符合市场预期。', symbols: ['XAUUSD', 'DXY'], duration: '中期' },
    { source: 'bloomberg', title: 'XAUUSD 突破关键阻力位，分析师看好后市', impact: 'positive', summary: '黄金价格突破2380美元关键阻力位，技术面看涨信号增强。', symbols: ['XAUUSD'], duration: '短期' },
    { source: 'reuters', title: '地缘政治紧张局势加剧，避险需求上升', impact: 'high', summary: '中东地缘政治风险升级，投资者转向黄金等避险资产。', symbols: ['XAUUSD', 'WTI'], duration: '长期' },
    { source: 'forexfactory', title: '美元指数走弱，黄金多头受益', impact: 'positive', summary: 'DXY跌破104关口，为黄金提供了强劲支撑。', symbols: ['DXY', 'XAUUSD'], duration: '短期' },
    { source: 'bloomberg', title: '美国CPI数据超预期，市场重新评估降息预期', impact: 'high', summary: '最新CPI数据显示通胀韧性，市场对美联储降息时点的预期推迟。', symbols: ['XAUUSD', 'DXY', 'US10Y'], duration: '中期' },
    { source: 'coindesk', title: '比特币 ETF 持续净流入，BTC 逼近 70000 美元', impact: 'positive', summary: '比特币现货ETF连续第五日净流入，市场情绪乐观。', symbols: ['BTCUSD'], duration: '短期' },
    { source: 'reuters', title: '央行购金量创新高，黄金长期支撑强劲', impact: 'positive', summary: '全球央行第一季度黄金购买量创历史同期新高。', symbols: ['XAUUSD'], duration: '长期' },
    { source: 'bloomberg', title: '标普500指数再创历史新高', impact: 'medium', summary: '科技股领涨，标普500指数突破5500点。', symbols: ['SPX500'], duration: '短期' },
    { source: 'investing', title: 'WTI原油库存下降超预期，油价反弹', impact: 'medium', summary: '美国EIA数据显示原油库存降幅超预期，WTI原油反弹。', symbols: ['WTI', 'BRENT'], duration: '短期' },
    { source: 'fxstreet', title: '美国10年期国债收益率回落，实际利率下降支撑金价', impact: 'positive', summary: '美债收益率回落至4.2%下方，实际利率下降利好黄金。', symbols: ['US10Y', 'XAUUSD'], duration: '中期' },
    { source: 'reuters', title: '白银价格突破30美元，工业需求复苏', impact: 'medium', summary: '白银价格突破30美元关口，光伏和电子工业需求增长。', symbols: ['XAGUSD'], duration: '短期' },
    { source: 'bloomberg', title: '纳斯达克指数期货回落，科技股获利回吐', impact: 'low', summary: '部分科技巨头财报不及预期，纳斯达克指数承压。', symbols: ['NAS100'], duration: '短期' },
    { source: 'forexfactory', title: '欧洲央行释放鸽派信号，欧元走弱', impact: 'medium', summary: '欧洲央行暗示可能提前降息，欧元兑美元走弱。', symbols: ['DXY'], duration: '中期' },
    { source: 'investing', title: '黄金ETF持仓增加，机构投资者增持', impact: 'positive', summary: '全球最大黄金ETF SPDR持仓量增加，显示机构投资者看多意愿。', symbols: ['GLD', 'XAUUSD'], duration: '中期' },
    { source: 'tradingview', title: 'COMEX黄金期货净多头持仓增加', impact: 'medium', summary: 'CFTC数据显示COMEX黄金期货投机性净多头持仓增加。', symbols: ['XAUUSD'], duration: '短期' },
  ];

  for (const n of newsItems) {
    await prisma.news.create({
      data: {
        source: n.source,
        title: n.title,
        url: `https://example.com/news/${n.title.replace(/\s+/g, '-').slice(0, 40)}`,
        summary: n.summary,
        impact: n.impact,
        impactConfidence: 0.7 + Math.random() * 0.25,
        expectedDuration: n.duration,
        symbols: n.symbols,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 86400000),
      },
    });
  }

  // Seed signals
  const signalData = [
    { symbolCode: 'XAUUSD', action: 'buy', price: 2358, entry: 2350, tp: 2390, sl: 2335, confidence: 0.82, status: 'open', timeframe: '4h' },
    { symbolCode: 'XAUUSD', action: 'buy', price: 2330, entry: 2325, tp: 2360, sl: 2310, confidence: 0.75, status: 'hit_tp', timeframe: '1d' },
    { symbolCode: 'BTCUSD', action: 'sell', price: 67800, entry: 68000, tp: 65000, sl: 69000, confidence: 0.68, status: 'open', timeframe: '4h' },
    { symbolCode: 'XAGUSD', action: 'buy', price: 28.8, entry: 28.5, tp: 30.0, sl: 27.8, confidence: 0.71, status: 'open', timeframe: '1d' },
    { symbolCode: 'DXY', action: 'sell', price: 104.5, entry: 104.8, tp: 103.5, sl: 105.5, confidence: 0.77, status: 'open', timeframe: '1d' },
    { symbolCode: 'XAUUSD', action: 'buy', price: 2365, entry: 2360, tp: 2400, sl: 2345, confidence: 0.79, status: 'hit_tp', timeframe: '1h' },
    { symbolCode: 'WTI', action: 'buy', price: 78.2, entry: 77.8, tp: 80.5, sl: 76.5, confidence: 0.65, status: 'open', timeframe: '4h' },
    { symbolCode: 'SPX500', action: 'hold', price: 5430, entry: null, tp: null, sl: null, confidence: 0.55, status: 'open', timeframe: '1d' },
  ];

  for (const sig of signalData) {
    const symId = symbolMap[sig.symbolCode];
    if (!symId) continue;
    await prisma.signal.create({
      data: {
        symbolId: symId,
        action: sig.action,
        price: sig.price,
        entry: sig.entry,
        tp: sig.tp,
        sl: sig.sl,
        confidence: sig.confidence,
        status: sig.status as any,
        timeframe: sig.timeframe,
        createdAt: new Date(Date.now() - Math.random() * 14 * 86400000),
      },
    });
  }

  // Seed AI analyses
  const analysisData = [
    { symbolCode: 'XAUUSD', timeframe: '1d', trend: 'bullish', action: 'buy', confidence: 0.82, entry: 2355, sl: 2330, tp: 2400, riskLevel: 'medium' },
    { symbolCode: 'XAUUSD', timeframe: '4h', trend: 'bullish', action: 'buy', confidence: 0.78, entry: 2360, sl: 2340, tp: 2390, riskLevel: 'medium' },
    { symbolCode: 'XAUUSD', timeframe: '1h', trend: 'neutral', action: 'hold', confidence: 0.55, entry: null, sl: null, tp: null, riskLevel: 'low' },
    { symbolCode: 'BTCUSD', timeframe: '1d', trend: 'bearish', action: 'sell', confidence: 0.68, entry: 68000, sl: 69000, tp: 65000, riskLevel: 'high' },
    { symbolCode: 'DXY', timeframe: '1d', trend: 'bearish', action: 'sell', confidence: 0.74, entry: 104.8, sl: 105.5, tp: 103.2, riskLevel: 'medium' },
    { symbolCode: 'XAGUSD', timeframe: '1d', trend: 'bullish', action: 'buy', confidence: 0.71, entry: 28.5, sl: 27.5, tp: 30.2, riskLevel: 'medium' },
  ];

  for (const a of analysisData) {
    const symId = symbolMap[a.symbolCode];
    if (!symId) continue;
    await prisma.aiAnalysis.create({
      data: {
        symbolId: symId,
        timeframe: a.timeframe,
        trend: a.trend,
        action: a.action,
        confidence: a.confidence,
        entry: a.entry,
        stopLoss: a.sl,
        takeProfit: a.tp,
        riskLevel: a.riskLevel,
        summary: `${a.trend === 'bullish' ? '看涨' : a.trend === 'bearish' ? '看跌' : '震荡'}趋势，建议${a.action === 'buy' ? '做多' : a.action === 'sell' ? '做空' : '观望'}`,
        reasons: ['技术指标显示趋势信号', '成交量支持当前方向', '市场情绪偏积极'],
        evidence: { pattern: 'double_bottom', support: a.entry ? a.entry - 15 : null, resistance: a.entry ? a.entry + 25 : null },
        modelVersion: { version: 'fusion-v2.1', generatedAt: new Date().toISOString() },
        createdAt: new Date(Date.now() - Math.random() * 7 * 86400000),
      },
    });
  }

  // Seed forecasts
  const forecastData = [
    { symbolCode: 'XAUUSD', horizon: '1d', pUp: 0.45, pDown: 0.30, median: 2365, low: 2340, high: 2390, confidence: 0.75 },
    { symbolCode: 'XAUUSD', horizon: '1w', pUp: 0.50, pDown: 0.30, median: 2380, low: 2330, high: 2430, confidence: 0.70 },
    { symbolCode: 'XAUUSD', horizon: '1m', pUp: 0.55, pDown: 0.25, median: 2400, low: 2300, high: 2480, confidence: 0.65 },
    { symbolCode: 'BTCUSD', horizon: '1w', pUp: 0.40, pDown: 0.45, median: 67000, low: 63000, high: 71000, confidence: 0.60 },
    { symbolCode: 'DXY', horizon: '1w', pUp: 0.30, pDown: 0.55, median: 103.8, low: 102.5, high: 105.2, confidence: 0.72 },
  ];

  for (const f of forecastData) {
    const symId = symbolMap[f.symbolCode];
    if (!symId) continue;
    await prisma.forecast.create({
      data: {
        symbolId: symId,
        horizon: f.horizon,
        pUp: f.pUp,
        pDown: f.pDown,
        pRange: Math.round((1 - Math.abs(f.pUp - f.pDown)) * 10000) / 10000,
        medianPrice: f.median,
        lowBound: f.low,
        highBound: f.high,
        confidence: f.confidence,
        createdAt: new Date(Date.now() - Math.random() * 3 * 86400000),
      },
    });
  }

  // Seed journal entries
  const journalData = [
    { symbolCode: 'XAUUSD', side: 'buy', entryPrice: 2340, exitPrice: 2375, qty: 1, profit: 35, note: '4H级别突破追多，顺利止盈', tags: ['突破', '4H'], openedAt: new Date(Date.now() - 10 * 86400000), closedAt: new Date(Date.now() - 9 * 86400000) },
    { symbolCode: 'XAUUSD', side: 'buy', entryPrice: 2360, exitPrice: 2350, qty: 1, profit: -10, note: '假突破后止损出局', tags: ['假突破', '止损'], openedAt: new Date(Date.now() - 7 * 86400000), closedAt: new Date(Date.now() - 6 * 86400000) },
    { symbolCode: 'BTCUSD', side: 'sell', entryPrice: 68500, exitPrice: 66000, qty: 0.1, profit: 250, note: '阻力位做空，DXY走强助攻', tags: ['做空', '阻力位'], openedAt: new Date(Date.now() - 5 * 86400000), closedAt: new Date(Date.now() - 4 * 86400000) },
    { symbolCode: 'XAUUSD', side: 'buy', entryPrice: 2355, exitPrice: null, qty: 0.5, profit: null, note: '长期看涨，继续持有', tags: ['持有', '长期'], openedAt: new Date(Date.now() - 2 * 86400000), closedAt: null },
  ];

  for (const j of journalData) {
    const symId = symbolMap[j.symbolCode];
    if (!symId) continue;
    await prisma.journal.create({
      data: {
        userId: user.id,
        symbolId: symId,
        side: j.side,
        entryPrice: j.entryPrice,
        exitPrice: j.exitPrice,
        qty: j.qty,
        profit: j.profit,
        note: j.note,
        tags: j.tags,
        openedAt: j.openedAt,
        closedAt: j.closedAt,
      },
    });
  }

  // Add watchlist
  const watchlistSymbols = ['XAUUSD', 'BTCUSD', 'DXY', 'SPX500'];
  for (let i = 0; i < watchlistSymbols.length; i++) {
    const symId = symbolMap[watchlistSymbols[i]];
    if (!symId) continue;
    await prisma.watchlist.upsert({
      where: { userId_symbolId: { userId: user.id, symbolId: symId } },
      update: { sortOrder: i },
      create: { userId: user.id, symbolId: symId, sortOrder: i },
    });
  }


  // Seed demo license keys (付费授权演示). 上线前请通过管理端生成并妥善保管。
  const demoLicenses = [
    { key: 'ALPHAX-PRO-DEMO-0001', plan: 'pro', maxActivations: 1 },
    { key: 'ALPHAX-ENT-DEMO-0001', plan: 'enterprise', maxActivations: 1 },
  ];
  for (const l of demoLicenses) {
    await prisma.license.upsert({
      where: { key: l.key },
      update: { plan: l.plan as any, maxActivations: l.maxActivations },
      create: { key: l.key, plan: l.plan as any, maxActivations: l.maxActivations },
    });
  }

  console.log('Seed completed successfully');
  console.log(`  - ${symbolsData.length} symbols`);
  console.log(`  - ${newsItems.length} news articles`);
  console.log(`  - ${signalData.length} signals`);
  console.log(`  - ${analysisData.length} AI analyses`);
  console.log(`  - ${forecastData.length} forecasts`);
  console.log(`  - ${journalData.length} journal entries`);
  console.log(`  - ${watchlistSymbols.length} watchlist items`);
  console.log(`  - Demo user: demo@alphax.com / demo123456`);
  console.log('  - 演示授权码:');
  for (const l of demoLicenses) {
    console.log(`      ${l.plan.padEnd(11)} ${l.key}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
