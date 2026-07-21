"use client";

import { useRef, useEffect } from "react";
import { Plus, MessageSquare, Trash2, X } from "lucide-react";
import type { ChatSession } from "../types";
import { ChatMessageBubble } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { cn } from "@/lib/cn";

interface ChatWindowProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onSendMessage: (content: string) => void;
  onClose?: () => void;
  sending?: boolean;
}

export function ChatWindow({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onSendMessage,
  onClose,
  sending,
}: ChatWindowProps) {
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages.length, sending]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-text">AI 对话</h2>
          {currentSession ? (
            <p className="truncate font-mono text-[10px] text-text-muted">
              {currentSession.symbol} · {currentSession.model} ·{" "}
              {currentSession.messageCount} 条消息
            </p>
          ) : (
            <p className="text-[10px] text-text-muted">向 AlphaX 咨询市场分析</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onNewSession}
            className="grid h-8 w-8 place-items-center text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text"
            aria-label="新建对话"
          >
            <Plus size={16} />
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text"
              aria-label="收起对话"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {sessions.length > 0 ? (
        <div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2">
          {sessions.map((s) => (
            <div key={s.id} className="group relative shrink-0">
              <button
                type="button"
                onClick={() => onSelectSession(s.id)}
                className={cn(
                  "flex max-w-[160px] items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors",
                  s.id === currentSessionId
                    ? "bg-accent/15 font-medium text-accent"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text",
                )}
              >
                <MessageSquare size={12} className="shrink-0 opacity-60" />
                <span className="truncate">{s.title}</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteSession(s.id)}
                className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-bg-elevated text-text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                aria-label="删除对话"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {currentSession ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              {currentSession.messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))}
              {sending && (
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                  AI 正在分析…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <ChatInput onSend={onSendMessage} disabled={!!sending} />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <MessageSquare size={32} className="mx-auto text-text-muted opacity-40" />
            <h3 className="mt-3 text-sm font-medium text-text-secondary">
              开始新的对话
            </h3>
            <p className="mt-1 text-xs text-text-muted">点击右上角 + 创建会话</p>
          </div>
        </div>
      )}
    </div>
  );
}
