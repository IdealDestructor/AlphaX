"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useChatUI } from "@/lib/chat-ui-context";
import { useSymbol } from "@/lib/symbol-context";
import { featureIsMock } from "@/lib/api/mock";
import { SkeletonPanel, EmptyState } from "@/components/state/States";
import { ChatWindow } from "./ChatWindow";
import {
  useChatPageData,
  useSendMessage,
  useSendMessageStream,
  useCreateSession,
  useDeleteSession,
} from "../api";

export function ChatDrawer() {
  const { open, closeChat } = useChatUI();
  const { data, isLoading } = useChatPageData();
  const sendMessage = useSendMessage();
  const sendStream = useSendMessageStream();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const { currentSymbol: symbol } = useSymbol();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeChat();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  const handleSelectSession = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const handleNewSession = useCallback(() => {
    createSession.mutate(
      { symbol },
      { onSuccess: (session) => setCurrentId(session.id) },
    );
  }, [createSession, symbol]);

  const handleDeleteSession = useCallback(
    (id: string) => {
      deleteSession.mutate(id);
      if (id === (currentId ?? data?.currentSessionId)) {
        const next = data?.sessions.find((s) => s.id !== id);
        setCurrentId(next?.id ?? null);
      }
    },
    [currentId, data?.currentSessionId, data?.sessions, deleteSession],
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      const id = currentId ?? data?.currentSessionId;
      if (!id) return;
      if (featureIsMock("chat")) {
        sendMessage.mutate({ sessionId: id, content });
      } else {
        sendStream.mutate({ sessionId: id, content });
      }
    },
    [currentId, data?.currentSessionId, sendMessage, sendStream],
  );

  const sessionId = currentId ?? data?.currentSessionId ?? "";
  const sending = sendMessage.isPending || sendStream.isPending;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 md:bg-black/25",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeChat}
        aria-hidden={!open}
      />

      <aside
        id="chat-drawer"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-border bg-bg-panel shadow-[-12px_0_40px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="AI 对话"
        aria-hidden={!open}
      >
        {isLoading ? (
          <div className="p-4">
            <SkeletonPanel lines={6} />
          </div>
        ) : !data || data.sessions.length === 0 ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-end gap-1 border-b border-border px-4 py-3">
              <button
                type="button"
                onClick={handleNewSession}
                className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text"
              >
                <Plus size={15} />
                新建对话
              </button>
              <button
                type="button"
                onClick={closeChat}
                className="text-sm text-text-secondary hover:text-text"
              >
                收起
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center p-4">
              <EmptyState
                title="暂无对话"
                description="开始一个新的 AI 对话，向 AlphaX 咨询市场分析。"
              />
            </div>
          </div>
        ) : (
          <ChatWindow
            sessions={data.sessions}
            currentSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onSendMessage={handleSendMessage}
            onClose={closeChat}
            sending={sending}
          />
        )}
      </aside>
    </>
  );
}
