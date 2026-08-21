"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { useChatUI } from "@/lib/chat-ui-context";

export function ChatFab() {
  const { open, toggleChat } = useChatUI();

  // 抽屉打开时隐藏悬浮按钮，关闭只走抽屉右上角的 ×
  if (open) return null;

  return (
    <button
      type="button"
      onClick={toggleChat}
      aria-expanded={open}
      aria-controls="chat-drawer"
      aria-label="问 AI"
      className={cn(
        "fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full border border-accent/40 bg-accent text-[#04120c] shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-all duration-200 hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:bottom-6 sm:right-6",
      )}
    >
      <MessageSquare size={22} />
    </button>
  );
}
