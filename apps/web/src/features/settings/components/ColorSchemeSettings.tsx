import type { ColorScheme } from "@/features/settings/types";

interface Props {
  value: ColorScheme;
  onChange: (v: ColorScheme) => void;
}

export function ColorSchemeSettings({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-muted">选择行情走势配色风格</p>
      <div className="flex gap-3">
        <button
          onClick={() => onChange("international")}
          className={`flex flex-1 flex-col gap-2 border p-3 text-left transition-colors ${
            value === "international"
              ? "border-accent bg-accent-muted/30"
              : "border-border hover:bg-bg-elevated/50"
          }`}
        >
          <span className="text-sm font-medium text-text">国际标准</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-xs text-bullish">
              <span className="h-2 w-2 rounded-full bg-bullish" />涨 ↑ 绿
            </span>
            <span className="flex items-center gap-1 font-mono text-xs text-bearish">
              <span className="h-2 w-2 rounded-full bg-bearish" />跌 ↓ 红
            </span>
          </div>
        </button>
        <button
          onClick={() => onChange("chinese")}
          className={`flex flex-1 flex-col gap-2 border p-3 text-left transition-colors ${
            value === "chinese"
              ? "border-accent bg-accent-muted/30"
              : "border-border hover:bg-bg-elevated/50"
          }`}
        >
          <span className="text-sm font-medium text-text">中国国内</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-xs text-danger">
              <span className="h-2 w-2 rounded-full bg-danger" />涨 ↑ 红
            </span>
            <span className="flex items-center gap-1 font-mono text-xs text-bullish">
              <span className="h-2 w-2 rounded-full bg-bullish" />跌 ↓ 绿
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
