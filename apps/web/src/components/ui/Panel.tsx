import { cn } from "@/lib/cn";

interface PanelProps {
  title: string;
  subtitle?: string;
  tools?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  id?: string;
}

export function Panel({
  title,
  subtitle,
  tools,
  className,
  bodyClassName,
  contentClassName,
  children,
  id,
}: PanelProps) {
  return (
    <section
      id={id}
      className={cn(
        "flex min-h-0 min-w-0 flex-col bg-bg-panel border border-border rounded-lg overflow-hidden",
        className,
      )}
    >
      <header className="flex min-h-[44px] items-center justify-between gap-3 border-b border-border bg-bg-elevated/40 px-4 py-2.5">
        <h2 className="m-0 text-sm font-semibold text-text">
          {title}
          {subtitle ? (
            <span className="ml-2 text-xs font-normal text-text-muted">{subtitle}</span>
          ) : null}
        </h2>
        {tools ? <div className="flex shrink-0 items-center gap-2">{tools}</div> : null}
      </header>
      <div className={cn("flex-1 min-h-0", bodyClassName ?? "p-4", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
