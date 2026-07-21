import { cn } from "@/lib/cn";
import { CATEGORIES, ASSETS, getAssetInfo } from "@/lib/assets";
import type { AssetCategory } from "@/lib/assets";
import { useMemo } from "react";

interface Props {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
}

export function AssetSwitcher({ activeSymbol, onSelect }: Props) {
  const active = getAssetInfo(activeSymbol);

  const grouped = useMemo(() => {
    const map: Record<string, typeof ASSETS> = {};
    for (const cat of CATEGORIES) {
      map[cat.key] = ASSETS.filter((a) => a.category === cat.key);
    }
    return map;
  }, []);

  return (
    <section className="border border-border bg-bg-panel">
      <div className="flex flex-wrap items-stretch">
        {CATEGORIES.map((cat) => {
          const items = grouped[cat.key] ?? [];
          const isActiveCategory = active.category === cat.key;
          return (
            <div
              key={cat.key}
              className={cn(
                "flex flex-1 flex-col border-r border-border last:border-r-0 min-w-0",
                isActiveCategory && "bg-accent-muted/20",
              )}
            >
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </div>
              <div className="flex flex-col">
                {items.map((asset) => {
                  const isActive = activeSymbol === asset.symbol;
                  return (
                    <button
                      key={asset.symbol}
                      onClick={() => onSelect(asset.symbol)}
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
    </section>
  );
}
