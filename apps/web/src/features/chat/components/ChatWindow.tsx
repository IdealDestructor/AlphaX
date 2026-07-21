"use client";

import { useRef, useEffect } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import type { ChatSession } from "../types";
import { ChatMessageBubble } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatWindowProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onSendMessage: (content: string) => void;
  sending?: boolean;
}

export function ChatWindow({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onSendMessage,
  sending,
}: ChatWindowProps) {
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages.length, sending]);

  return (
    <div className="flex h-[calc(100vh-52px-2rem)] min-h-0 gap-4">
      {/* Session sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col gap-2 sm:flex">
        <button
          onClick={onNewSession}
          className="flex h-9 items-center gap-2 border border-border bg-bg-panel px-3 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text"
        >
          <Plus size={14} />
          新建对话
        </button>

        <div className="flex flex-col gap-1 overflow-y-auto">
          {sessions.map((s) => (
            <div key={s.id} className="group flex items-center">
              <button
                onClick={() => onSelectSession(s.id)}
                className={`flex min-h-0 flex-1 items-center gap-2 rounded-l-sm px-3 py-2 text-left text-sm transition-colors ${
                  s.id === currentSessionId
                    ? "bg-accent/10 text-text font-medium"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text"
                }`}
              >
                <MessageSquare size={14} className="shrink-0 opacity-60" />
                <span className="truncate">{s.title}</span>
              </button>
              <button
                onClick={() => onDeleteSession(s.id)}
                className="flex h-full items-center px-1.5 text-text-muted opacity-0 hover:text-danger group-hover:opacity-100 transition-opacity"
                aria-label="删除对话"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col border border-border bg-bg-panel">
        {currentSession ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-text">
                  {currentSession.title}
                </h2>
                <p className="font-mono text-[10px] text-text-muted">
                  {currentSession.symbol} · {currentSession.model} ·{" "}
                  {currentSession.messageCount} 条消息
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mx-auto flex max-w-[720px] flex-col gap-4">
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

            {/* Input */}
            <ChatInput onSend={onSendMessage} disabled={!!sending} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare size={32} className="mx-auto text-text-muted opacity-40" />
              <h3 className="mt-3 text-sm font-medium text-text-secondary">
                选择或创建一个对话
              </h3>
              <p className="mt-1 text-xs text-text-muted">或点击左侧「新建对话」开始</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
