import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchAllFeeds } from "./parser";
import { RSS_SOURCES } from "./sources";

const RSS2 = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Kitco News</title>
  <item>
    <title>Gold prices rise as Fed signals rate cuts, dollar slips</title>
    <link>https://www.kitco.com/news/example-1</link>
    <pubDate>Thu, 20 Aug 2026 08:30:00 GMT</pubDate>
    <description><![CDATA[<p>Spot gold XAUUSD climbed as the Federal Reserve hinted at lower interest rates.</p>]]></description>
    <guid>kitco-1</guid>
  </item>
  <item>
    <title>Silver demand surges on industrial output</title>
    <link>https://www.kitco.com/news/example-2</link>
    <pubDate>Thu, 20 Aug 2026 07:00:00 GMT</pubDate>
    <description>Silver XAGUSD demand is rising.</description>
    <guid>kitco-2</guid>
  </item>
</channel></rss>`;

const GOOGLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Google News</title>
  <item>
    <title>Bitcoin rallies as cryptocurrency market rebounds</title>
    <link>https://news.google.com/example-1</link>
    <pubDate>Thu, 20 Aug 2026 06:00:00 GMT</pubDate>
    <description>Bitcoin BTC price moved higher today.</description>
    <guid>google-1</guid>
  </item>
</channel></rss>`;

describe("rss parser (offline, mocked fetch)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("parses RSS 2.0 feeds, detects symbols/category/impact", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      const u = String(url);
      const xml = u.includes("google") ? GOOGLE_RSS : RSS2;
      return new Response(xml, { status: 200 });
    });

    const { items, errors } = await fetchAllFeeds();
    expect(errors).toEqual([]);
    expect(spy).toHaveBeenCalledTimes(RSS_SOURCES.length);
    expect(items.length).toBeGreaterThanOrEqual(3);

    const gold = items.find((i) => i.title.includes("Gold prices"));
    expect(gold).toBeDefined();
    expect(gold!.symbols).toContain("XAUUSD");
    expect(gold!.impact).toBe("high"); // "federal reserve"/"interest rate" keyword
    expect(new Date(gold!.publishedAt).getTime()).toBeGreaterThan(0);

    const btc = items.find((i) => i.title.includes("Bitcoin"));
    expect(btc).toBeDefined();
    expect(btc!.symbols).toContain("BTCUSD");

    // newest first
    const times = items.map((i) => new Date(i.publishedAt).getTime());
    const sorted = [...times].sort((a, b) => b - a);
    expect(times).toEqual(sorted);
  }, 30_000);
});
