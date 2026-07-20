import { cn } from "@/lib/cn";

export function Button({
  variant = "ghost",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary: "bg-accent text-[#04120c] border-accent hover:brightness-95",
    secondary: "bg-bg-panel text-text border-border hover:bg-bg-elevated",
    ghost: "bg-transparent text-text-secondary border-transparent hover:bg-bg-panel hover:text-text",
  };
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-sm border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
