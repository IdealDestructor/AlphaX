"use client";

import { cn } from "@/lib/cn";
import {
    LayoutDashboard,
    LineChart,
    BrainCircuit,
    Zap,
    TrendingUp,
    Newspaper,
    MessageSquare,
    Bell,
    Settings,
    X,
} from "lucide-react";
import { useEffect } from "react";

const navItems = [
    { key: "overview", label: "市场总览", icon: LayoutDashboard, active: true },
    { key: "market", label: "实时行情", icon: LineChart, active: false },
    { key: "analysis", label: "AI 分析", icon: BrainCircuit, active: false },
    { key: "signals", label: "AI 信号", icon: Zap, active: false },
    { key: "forecast", label: "概率预测", icon: TrendingUp, active: false },
] as const;

const workspaceItems = [
    { key: "news", label: "新闻摘要", icon: Newspaper },
    { key: "chat", label: "AI 对话", icon: MessageSquare },
    { key: "alerts", label: "价格告警", icon: Bell },
    { key: "settings", label: "设置", icon: Settings },
] as const;

export function Sidebar({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        <>
            {open ? (
                <div
                    className="fixed inset-0 z-25 bg-black/50 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            ) : null}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-30 flex h-screen w-[280px] max-w-[86vw] flex-col border-r border-border bg-bg-panel transition-transform duration-160 md:sticky md:translate-x-0",
                    open ? "translate-x-0" : "-translate-x-full",
                )}
                aria-label="主导航"
            >
                <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="grid h-7 w-7 place-items-center bg-accent font-mono text-xs font-bold text-[#04120c]">
                            AX
                        </div>
                        <div>
                            <div className="text-sm font-semibold leading-tight">AlphaX</div>
                            <div className="text-xs text-text-muted">智能投资分析</div>
                        </div>
                    </div>
                    <button
                        className="text-text-muted hover:text-text md:hidden"
                        onClick={onClose}
                        aria-label="关闭导航"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-2">
                    {navItems.map((item) => (
                        <a
                            key={item.key}
                            href="#"
                            aria-current={item.active ? "page" : undefined}
                            className={cn(
                                "flex min-h-[40px] items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm transition-colors",
                                item.active
                                    ? "border-accent bg-accent-muted/30 font-semibold text-text"
                                    : "text-text-secondary hover:bg-bg-elevated hover:text-text",
                            )}
                        >
                            <item.icon size={16} className={item.active ? "text-accent" : "opacity-75"} />
                            {item.label}
                        </a>
                    ))}

                    <div className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        工作区
                    </div>
                    {workspaceItems.map((item) => (
                        <a
                            key={item.key}
                            href="#"
                            className="flex min-h-[40px] items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text"
                        >
                            <item.icon size={16} className="opacity-75" />
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-3 border-t border-border p-4">
                    <div className="grid h-8 w-8 place-items-center border border-border bg-bg-elevated text-xs font-semibold text-text-secondary">
                        G
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-medium">Guest User</div>
                        <div className="text-xs text-text-muted">Pro · 席位 1/1</div>
                    </div>
                </div>
            </aside>
        </>
    );
}
