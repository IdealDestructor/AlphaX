"use client";

import { Button } from "@/components/ui/Button";
import { Menu, Search, Bell, Settings, LogOut, Crown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ASSETS } from "@/lib/assets";
import { AssetSwitcher } from "@/features/dashboard/components/AssetSwitcher";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";

const routeTitles: Record<string, string> = {
  "/": "市场总览",
  "/market": "实时行情",
  "/analysis": "智能分析",
  "/signals": "交易信号",
  "/forecast": "概率预测",
  "/news": "新闻摘要",
  "/alerts": "价格告警",
  "/watchlist": "自选",
  "/sentiment": "市场情绪",
  "/smart-money": "聪明钱",
  "/journal": "交易日志",
  "/tools": "交易工具",
  "/enterprise": "企业工作台",
  "/settings": "设置",
  "/billing": "套餐与授权",
};

const PLAN_LABEL: Record<string, string> = { free: "免费", pro: "Pro", enterprise: "Ent" };
const PLAN_TONE: Record<string, "neutral" | "bull" | "wait"> = { free: "neutral", pro: "bull", enterprise: "wait" };

export function Topbar({
  onMenu,
  statusLabel = "行情正常",
  statusTone = "ok",
  updatedAt,
}: {
  onMenu: () => void;
  statusLabel?: string;
  statusTone?: "ok" | "warn" | "err";
  updatedAt?: string | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const dotColor =
    statusTone === "err"
      ? "bg-danger"
      : statusTone === "warn"
        ? "bg-warning"
        : "bg-bullish";

  const title = Object.entries(routeTitles).find(([key]) =>
    key === "/" ? pathname === "/" : pathname.startsWith(key),
  )?.[1];

  const showAssetSwitcher =
    !pathname.startsWith("/alerts") &&
    !pathname.startsWith("/settings") &&
    !pathname.startsWith("/billing") &&
    !pathname.startsWith("/watchlist") &&
    !pathname.startsWith("/journal") &&
    !pathname.startsWith("/tools") &&
    !pathname.startsWith("/sentiment") &&
    !pathname.startsWith("/smart-money") &&
    !pathname.startsWith("/enterprise");

  const symbolsList = ASSETS.map((a) => a.symbol).join("、");

  const onLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-15 border-b border-border bg-bg">
      <div className="flex min-h-[52px] items-center justify-between gap-4 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="text-text-secondary hover:text-text md:hidden"
            onClick={onMenu}
            aria-label="打开导航"
          >
            <Menu size={18} />
          </button>
          {title && (
            <h1 className="whitespace-nowrap text-lg font-semibold tracking-tight">
              {title}
            </h1>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--bullish)]/35 bg-[color:var(--bullish)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bullish">
            <span className="h-1.5 w-1.5 rounded-full bg-bullish" />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <form
            role="search"
            className="hidden items-center gap-2 border border-border bg-bg-panel px-3 h-9 min-w-[220px] sm:flex focus-within:border-accent"
          >
            <Search size={14} className="text-text-muted" />
            <input
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
              placeholder={`搜索 ${symbolsList}…`}
            />
            <kbd className="font-mono text-[10px] text-text-muted border border-border bg-bg px-1">/</kbd>
          </form>

          <span className="hidden items-center gap-1.5 font-mono text-xs text-text-muted lg:inline-flex">
            <span className={`h-[7px] w-[7px] rounded-full ${dotColor}`} />
            {statusLabel}
          </span>

          {updatedAt ? (
            <span className="hidden font-mono text-xs text-text-muted xl:inline">
              {updatedAt}
            </span>
          ) : null}

          {isAuthenticated && user ? (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => router.push("/billing")} aria-label="套餐与授权">
                <Crown size={16} />
                <Badge tone={PLAN_TONE[user.plan] ?? "neutral"}>{PLAN_LABEL[user.plan] ?? user.plan}</Badge>
              </Button>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={onLogout} aria-label="退出登录">
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            !isLoading && (
              <Button variant="secondary" onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}>
                登录
              </Button>
            )
          )}

          <Button variant="secondary">刷新</Button>
          <Button
            variant="ghost"
            className="w-9 px-0"
            onClick={() => router.push("/alerts")}
            aria-label="价格告警"
            aria-current={pathname.startsWith("/alerts") ? "page" : undefined}
          >
            <Bell size={16} />
          </Button>
          <Button
            variant="ghost"
            className="w-9 px-0"
            onClick={() => router.push("/settings")}
            aria-label="设置"
            aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
      {showAssetSwitcher ? <AssetSwitcher /> : null}
    </header>
  );
}
