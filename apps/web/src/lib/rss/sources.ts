export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  weight: number;
}

export const RSS_SOURCES: RssSource[] = [
  {
    id: "google-gold",
    name: "Google News",
    url: "https://news.google.com/rss/search?q=gold+precious+metals+market&hl=en-US&gl=US&ceid=US:en",
    category: "贵金属",
    weight: 0.7,
  },
  {
    id: "google-macro",
    name: "Google News",
    url: "https://news.google.com/rss/search?q=federal+reserve+inflation+economy+market&hl=en-US&gl=US&ceid=US:en",
    category: "宏观经济",
    weight: 0.7,
  },
  {
    id: "google-crypto",
    name: "Google News",
    url: "https://news.google.com/rss/search?q=bitcoin+cryptocurrency+market&hl=en-US&gl=US&ceid=US:en",
    category: "数字货币",
    weight: 0.7,
  },
  {
    id: "google-forex",
    name: "Google News",
    url: "https://news.google.com/rss/search?q=forex+currency+dollar+market&hl=en-US&gl=US&ceid=US:en",
    category: "外汇",
    weight: 0.7,
  },
  {
    id: "google-oil",
    name: "Google News",
    url: "https://news.google.com/rss/search?q=crude+oil+energy+market&hl=en-US&gl=US&ceid=US:en",
    category: "大宗商品",
    weight: 0.7,
  },
  {
    id: "kitco",
    name: "Kitco",
    url: "https://www.kitco.com/news/rss/latest.xml",
    category: "贵金属",
    weight: 0.9,
  },
  {
    id: "coindesk",
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "数字货币",
    weight: 0.85,
  },
  {
    id: "cnbc",
    name: "CNBC",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    category: "宏观经济",
    weight: 0.8,
  },
];
