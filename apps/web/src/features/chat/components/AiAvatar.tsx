"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * AI 助手头像：品牌深色底 + 绿色渐变四角星（Spark）与轨道点缀。
 * 贴合 UI_UX_SPEC 暗色主题（--accent #3ecf8e），不使用紫白模板风。
 */
export function AiAvatar({ className }: { className?: string }) {
  const rawId = useId();
  const gradId = `ai-avatar-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md border border-accent/35",
        "bg-gradient-to-br from-[#173326] via-[#0d1a14] to-[#0a0f0c]",
        "shadow-[inset_0_0_12px_rgba(62,207,142,0.18)]",
        className,
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6ef2b2" />
            <stop offset="1" stopColor="#2ea87a" />
          </linearGradient>
        </defs>
        <path
          d="M12 3c.75 3.55 2.35 6.1 5.5 7.25C14.35 11.4 12.75 13.95 12 17.5c-.75-3.55-2.35-6.1-5.5-7.25C9.65 9.1 11.25 6.55 12 3Z"
          fill={'url(#' + gradId + ')'}
        />
        <circle cx="18.8" cy="5" r="1.15" fill="#6ef2b2" opacity="0.9" />
        <circle cx="19.6" cy="18.4" r="0.85" fill="#3ecf8e" opacity="0.55" />
        <circle cx="4.6" cy="16.6" r="0.6" fill="#3ecf8e" opacity="0.4" />
      </svg>
    </div>
  );
}
