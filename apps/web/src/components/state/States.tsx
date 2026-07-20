export function SkeletonPanel({ lines = 4 }: { lines?: number }) {
  return (
    <div className="animate-pulse p-4" aria-busy="true" aria-live="polite">
      <div className="mb-4 h-4 w-40 rounded bg-bg-elevated" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="mb-2 h-3 rounded bg-bg-elevated"
          style={{ width: `${92 - i * 8}%` }}
        />
      ))}
      <p className="sr-only">正在加载…</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-text-secondary">
      <div className="grid h-10 w-10 place-items-center border border-border bg-bg text-text-muted">
        <span className="text-lg">?</span>
      </div>
      <h3 className="m-0 text-base font-semibold text-text">{title}</h3>
      <p className="m-0 max-w-[280px] text-sm text-text-muted">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-8 text-center text-text-secondary"
      role="alert"
    >
      <div className="grid h-10 w-10 place-items-center border border-[color:var(--danger)]/40 bg-bg text-danger">
        <span className="text-lg">!</span>
      </div>
      <h3 className="m-0 text-base font-semibold text-text">{title}</h3>
      <p className="m-0 max-w-[320px] text-sm text-text-muted">{description}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex h-9 items-center rounded-sm border border-border bg-bg-panel px-4 text-sm font-medium text-text hover:bg-bg-elevated"
        >
          立即重试
        </button>
      ) : null}
    </div>
  );
}
