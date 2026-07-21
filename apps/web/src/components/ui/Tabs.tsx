import { cn } from "@/lib/cn";

interface TabDef {
  key: string;
  label: string;
  icon?: React.ElementType;
}

interface Props {
  tabs: readonly TabDef[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="inline-flex border border-border bg-bg">
      {tabs.map((t, i) => {
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex h-8 items-center gap-1.5 border-r border-border px-3 text-xs font-medium last:border-r-0 transition-colors",
              active === t.key
                ? "bg-bg-elevated font-semibold text-text"
                : "text-text-muted hover:text-text hover:bg-bg-elevated/50",
            )}
          >
            {Icon && <Icon size={14} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
