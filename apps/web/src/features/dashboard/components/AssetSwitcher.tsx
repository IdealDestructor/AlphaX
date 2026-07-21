"use client";

import { cn } from "@/lib/cn";
import { CATEGORIES, ASSETS, getAssetInfo } from "@/lib/assets";
import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSymbol } from "@/lib/symbol-context";
import { ChevronDown, ChevronUp } from "lucide-react";

export function AssetSwitcher() {
  const { currentSymbol, setCurrentSymbol } = useSymbol();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  const active = getAssetInfo(currentSymbol);
  const activeCategory = CATEGORIES.find((c) => c.key === active.category);

  const grouped = useMemo(() => {
    const map: Record<string, typeof ASSETS> = {};
    for (const cat of CATEGORIES) {
      map[cat.key] = ASSETS.filter((a) => a.category === cat.key);
    }
    return map;
  }, []);

  function handleSelect(symbol: string) {
    const marketMatch = pathname.match(/^\/market\/([A-Z]+)/);
    const analysisMatch = pathname.match(/^\/analysis\/([A-Z]+)/);

    if (marketMatch) {
      router.push(`/market/${symbol}`);
    } else if (analysisMatch) {
      router.push(`/analysis/${symbol}`);
    } else {
      setCurrentSymbol(symbol);
    }
  }

  return (
    <section className="border-t border-border bg-bg">
      <div className="flex items-center justify-between gap-3 px-5 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <span className="text-text-muted">{activeCategory?.icon}</span>
          <span className="font-mono font-semibold text-text">{active.symbol}</span>
          <span className="truncate text-text-muted">{active.name}</span>
          <span className="hidden text-text-muted sm:inline">·</span>
          <span className="hidden text-text-muted sm:inline">{activeCategory?.label}</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-text"
          aria-expanded={expanded}
          aria-label={expanded ? "收起品类面板" : "展开品类面板"}
        >
          <span className="hidden sm:inline">{expanded ? "收起" : "切换品种"}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded ? (
        <div className="flex flex-wrap items-stretch border-t border-border">
          {CATEGORIES.map((cat) => {
            const items = grouped[cat.key] ?? [];
            const isActiveCategory = active.category === cat.key;
            return (
              <div
                key={cat.key}
                className={cn(
                  "flex min-w-0 flex-1 flex-col border-r border-border last:border-r-0",
                  isActiveCategory && "bg-accent-muted/20",
                )}
              >
                <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <div className="flex flex-col">
                  {items.map((asset) => {
                    const isActive = currentSymbol === asset.symbol;
                    return (
                      <button
                        key={asset.symbol}
                        onClick={() => handleSelect(asset.symbol)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                          isActive
                            ? "bg-accent/15 font-semibold text-accent"
                            : "text-text-secondary hover:bg-bg-elevated hover:text-text",
                        )}
                      >
                        <span className="font-mono text-[11px]">{asset.symbol}</span>
                        <span className="text-text-muted">{asset.name}</span>
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
