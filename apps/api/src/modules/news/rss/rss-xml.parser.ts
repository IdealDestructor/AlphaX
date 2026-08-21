/**
 * 极简 RSS 2.0 / Atom XML 解析器（零依赖）。
 *
 * 只关心摄入新闻所需的字段（title/link/date/summary/source），不追求完整 XML 语义。
 * 解析策略：
 *  1. 按 <item>…</item> 或 <entry>…</entry> 切出条目
 *  2. 在条目内按标签名取首个字段，兼容自闭合 <link href="…"/> 与成对 <title>…</title>
 *  3. 统一做 HTML 实体解码与标签剥离
 */

export interface RssFeedItem {
  title: string;
  url: string;
  publishedAt: string | null; // ISO 或 null
  summary: string;
  guid: string;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(input: string): string {
  let out = input;
  for (const [k, v] of Object.entries(ENTITIES)) {
    out = out.split(k).join(v);
  }
  // 数字实体 &#123;
  out = out.replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)));
  return out;
}

function stripTags(input: string): string {
  return decodeEntities(input)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractText(block: string, tag: string): string | null {
  // 成对标签 <tag>…</tag>
  const openRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(openRe);
  if (m) return stripTags(m[1] ?? '');
  return null;
}

function extractHref(block: string, tag: string): string | null {
  // 自闭合/属性式 <link href="…"/> 或 <link … href='…' />
  const m = block.match(new RegExp(`<${tag}[^>]*\\shref=["']([^"']+)["']`, 'i'));
  return m ? decodeEntities(m[1] ?? '') : null;
}

function firstTag(block: string, tag: string): string {
  const direct = extractText(block, tag);
  if (direct) return direct;
  const href = extractHref(block, tag);
  return href ?? '';
}

function parseDate(value: string): string | null {
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null;
}

function normalizeGuid(block: string, source: string, url: string, title: string): string {
  const guid = extractText(block, 'guid') ?? extractText(block, 'id');
  if (guid) return guid;
  // 没有 guid 时用 URL 或标题哈希兜底，保证同源幂等
  const base = url || title;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return `${source}-${h.toString(36)}`;
}

/** 解析 RSS/Atom XML 文本，返回条目数组。失败返回空数组（不抛错，由调用方决定）。 */
export function parseRssFeed(xml: string, defaultSource: string): RssFeedItem[] {
  if (!xml || xml.trim().length === 0) return [];

  const items: RssFeedItem[] = [];
  const blockRe = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(xml)) !== null) {
    const block = match[2] ?? '';
    const title = firstTag(block, 'title').trim();
    if (!title) continue;

    let url = firstTag(block, 'link');
    if (!url) {
      // 部分源用 <link>text</link> 形式，firstTag 已覆盖；再试 <link rel="alternate">
      url = extractHref(block, 'link') ?? '';
    }

    const publishedRaw =
      firstTag(block, 'pubDate') ||
      firstTag(block, 'published') ||
      firstTag(block, 'updated') ||
      firstTag(block, 'dc:date');

    const summary =
      firstTag(block, 'description') ||
      firstTag(block, 'summary') ||
      firstTag(block, 'content') ||
      firstTag(block, 'encoded');

    const source =
      firstTag(block, 'source') || firstTag(block, 'dc:creator') || defaultSource;

    items.push({
      title,
      url: url || '#',
      publishedAt: parseDate(publishedRaw),
      summary: summary ? summary.slice(0, 500) : '',
      guid: normalizeGuid(block, source, url, title),
    });
  }

  return items;
}
