"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 border-t border-border bg-bg-panel p-4"
    >
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "问 AlphaX 关于市场的问题…"}
          disabled={disabled}
          rows={1}
          className="min-h-[44px] w-full resize-none border border-border bg-bg px-4 py-3 pr-12 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent disabled:opacity-55"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-sm bg-accent text-[#04120c] transition-colors hover:brightness-95 disabled:opacity-40"
        aria-label="发送消息"
      >
        {disabled ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </button>
    </form>
  );
}
