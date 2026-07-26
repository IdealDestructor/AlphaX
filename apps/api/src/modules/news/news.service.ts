import { Injectable } from '@nestjs/common';

export interface NewsItem {
  id: string;
  source: string;
  title: string;
  url: string;
  summary: string;
  symbols: string[];
  impact: string;
  impactConfidence: number;
  expectedDuration: string;
  publishedAt: string;
}

@Injectable()
export class NewsService {
  private sources = [
    { name: 'reuters', label: 'Reuters' },
    { name: 'bloomberg', label: 'Bloomberg' },
    { name: 'forexfactory', label: 'ForexFactory' },
    { name: 'investing', label: 'Investing.com' },
    { name: 'tradingview', label: 'TradingView' },
    { name: 'coindesk', label: 'CoinDesk' },
    { name: 'fxstreet', label: 'FXStreet' },
    { name: 'zerohedge', label: 'ZeroHedge' },
  ];

  async getNews(symbol?: string, limit: number = 50, offset: number = 0) {
    let news = this.generateNews(100);
    if (symbol) {
      news = news.filter((n) => n.symbols.includes(symbol));
    }
    return {
      items: news.slice(offset, offset + limit),
      total: news.length,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(news.length / limit),
    };
  }

  async getNewsById(id: string) {
    const news = this.generateNews(100);
    return news.find((n) => n.id === id) || null;
  }

  private generateNews(count: number): NewsItem[] {
    const news: NewsItem[] = [];
    const templates = [
      { title: '{symbol} 价格突破关键{level}水平，分析师看好后市', impact: 'positive', duration: '短期' },
      { title: '美联储{action}利率，市场反应{reaction}', impact: 'high', duration: '中期' },
      { title: '{symbol} 技术形态形成{pattern}，交易者需关注', impact: 'medium', duration: '短期' },
      { title: '地缘政治紧张局势加剧，{symbol} 避险需求上升', impact: 'high', duration: '长期' },
      { title: '{symbol} 库存数据超预期，价格{dir}', impact: 'medium', duration: '短期' },
      { title: '全球经济展望{outlook}，{symbol} 承压', impact: 'low', duration: '长期' },
      { title: '{symbol} 波动率指数上升，市场不确定性增加', impact: 'medium', duration: '中期' },
      { title: '央行{action}影响国债收益率，{symbol} 反应积极', impact: 'positive', duration: '中期' },
      { title: '技术指标显示{symbol} {signal}信号', impact: 'low', duration: '短期' },
      { title: '大宗商品市场{trend}，{symbol} 领涨', impact: 'positive', duration: '短期' },
    ];
    const symbols = ['XAUUSD', 'XAGUSD', 'BTCUSD', 'DXY', 'NAS100', 'SPX500', 'WTI', 'BRENT', 'GLD', 'SLV', 'SPY', 'US10Y'];
    const impacts = ['high', 'medium', 'low', 'positive'];
    const durations = ['短期', '中期', '长期'];

    for (let i = 0; i < count; i++) {
      const tpl = templates[i % templates.length];
      const s = [symbols[i % symbols.length]];
      const basePrice = s[0] === 'XAUUSD' ? 2350 : s[0] === 'BTCUSD' ? 67000 : 100;
      const newsItem: NewsItem = {
        id: `news_${i}`,
        source: this.sources[i % this.sources.length].name,
        title: tpl.title
          .replace(/{symbol}/g, s[0])
          .replace(/{level}/g, ['阻力', '支撑'][i % 2])
          .replace(/{action}/g, ['加息', '降息', '维持利率不变'][i % 3])
          .replace(/{reaction}/g, ['剧烈波动', '小幅上涨', '承压下跌'][i % 3])
          .replace(/{pattern}/g, ['头肩顶', '双底', '旗形', '三角形'][i % 4])
          .replace(/{dir}/g, ['上涨', '下跌'][i % 2])
          .replace(/{outlook}/g, ['下调', '上调'][i % 2])
          .replace(/{signal}/g, ['买入', '卖出'][i % 2])
          .replace(/{trend}/g, ['继续走高', '回调'][i % 2]),
        url: `https://example.com/news/${i}`,
        summary: `这是关于${s[0]}的市场分析新闻，对价格走势有${['积极', '重大', '一定', '正面'][i % 4]}影响。`,
        symbols: s,
        impact: impacts[i % impacts.length],
        impactConfidence: Math.round((0.5 + Math.random() * 0.45) * 100) / 100,
        expectedDuration: durations[i % durations.length],
        publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
      };
      news.push(newsItem);
    }
    return news;
  }
}
