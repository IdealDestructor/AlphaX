import { XMLParser } from "fast-xml-parser";
import { RSS_SOURCES, type RssSource } from "./sources";
import { matchSymbols, detectCategory, detectImpact } from "./keywords";
import type { AiNewsItem } from "@/features/news/types";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

interface RawRssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  source?: string | { "#text"?: string; "@_url"?: string };
  guid?: string | { "#text"?: string };
}

function parsePubDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function extractText(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    return typeof obj["#text"] === "string" ? obj["#text"] : "";
  }
  return "";
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function extractItems(source: RssSource, data: unknown): RawRssItem[] {
  try {
    const root = data as Record<string, unknown>;
    const rss = root?.rss as Record<string, unknown> | undefined;
    const channel = rss?.channel as Record<string, unknown> | undefined;
    const items = channel?.item;
    if (Array.isArray(items)) return items as RawRssItem[];
    if (items) return [items as RawRssItem];
  } catch {
    /* ignore malformed feed */
  }
  return [];
}

async function fetchSource(source: RssSource): Promise<AiNewsItem[]> {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 AlphaX/2.0" },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const items = extractItems(source, parsed);

    return items.map((item) => {
      const title = extractText(item.title);
      const link = extractText(item.link);
      const description = stripHtml(extractText(item.description));
      const publishedAt = parsePubDate(item.pubDate);
      const summary = description.slice(0, 300);
      const combined = title + " " + description;
      const symbols = matchSymbols(combined);
      const category = detectCategory(title, description) || source.category;
      const impact = detectImpact(combined);
      const id = `rss_${source.id}_${Buffer.from(link || title).toString("base64").slice(0, 24)}`;

      return {
        id,
        title,
        source: source.name,
        url: link || "#",
        publishedAt,
        category,
        symbols: symbols.length ? symbols : ["XAUUSD"],
        summary,
        impact,
        tone: "neutral" as const,
        confidence: source.weight,
        expectedDuration: "",
        content: description,
      };
    });
  } catch {
    return [];
  }
}

export function buildId(title: string, link: string): string {
  const raw = title + link;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "rss_" + Math.abs(hash).toString(36);
}

export async function fetchAllFeeds(): Promise<{
  items: AiNewsItem[];
  errors: string[];
}> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map((src) => fetchSource(src)),
  );

  const errors: string[] = [];
  const allItems: AiNewsItem[] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      allItems.push(...r.value);
    } else {
      errors.push(`${RSS_SOURCES[i]!.id}: ${r.reason?.message ?? "unknown"}`);
    }
  });

  const seen = new Set<string>();
  const deduped: AiNewsItem[] = [];

  for (const item of allItems.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )) {
    const key = item.title.toLowerCase().slice(0, 60);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return { items: deduped.slice(0, 100), errors };
}
