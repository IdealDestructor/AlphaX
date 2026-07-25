import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss/parser";
import type { NewsPageData } from "@/features/news/types";

export const revalidate = 120;

export async function GET() {
  try {
    const { items, errors } = await fetchAllFeeds();

    const categories = [...new Set(items.map((n) => n.category))].sort();
    const sources = [...new Set(items.map((n) => n.source))].sort();
    const availableSymbols = [...new Set(items.flatMap((n) => n.symbols))].sort();

    const data: NewsPageData = {
      items,
      categories,
      sources,
      availableSymbols,
      updatedAt: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    };

    if (errors.length) {
      console.warn("[RSS] partial errors:", errors);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[RSS] fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch news feeds" },
      { status: 500 },
    );
  }
}
