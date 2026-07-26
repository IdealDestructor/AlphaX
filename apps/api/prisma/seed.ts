import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create symbols
  const symbols = [
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

  for (const s of symbols) {
    await prisma.symbol.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 10);
  await prisma.user.upsert({
    where: { email: 'demo@alphax.com' },
    update: {},
    create: {
      email: 'demo@alphax.com',
      passwordHash,
      displayName: 'Demo User',
      role: 'user',
      plan: 'pro',
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai',
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
