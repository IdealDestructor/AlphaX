"use client";

import { useState, useCallback } from "react";
import { SkeletonPanel, EmptyState } from "@/components/state/States";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { useChatPageData, useSendMessage } from "@/features/chat/api";
import { useSymbol } from "@/lib/symbol-context";

export default function ChatPage() {
  const { data, isLoading, refetch } = useChatPageData();
  const sendMessage = useSendMessage();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const { currentSymbol: symbol } = useSymbol();

  const handleSelectSession = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const handleNewSession = useCallback(() => {
    // Stub — 后续将创建新会话（当前 symbol: ${symbol}）
    console.log("创建新会话，品种:", symbol);
  }, [symbol]);

  const handleDeleteSession = useCallback((id: string) => {
    // Stub — 后续将删除会话
  }, []);

  const handleSendMessage = useCallback(
    (content: string) => {
      const id = currentId ?? data?.currentSessionId;
      if (!id) return;
      sendMessage.mutate({ sessionId: id, content });
    },
    [currentId, data?.currentSessionId, sendMessage],
  );

  if (isLoading) {
    return (
      <div className="h-full">
        <SkeletonPanel lines={6} />
      </div>
    );
  }

  if (!data || data.sessions.length === 0) {
    return (
      <EmptyState
        title="暂无对话"
        description="开始一个新的 AI 对话，向 AlphaX 咨询市场分析。"
      />
    );
  }

  const sessionId = currentId ?? data.currentSessionId;

  return (
    <div className="flex flex-col gap-4 h-full">
      <ChatWindow
        sessions={data.sessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onSendMessage={handleSendMessage}
        sending={sendMessage.isPending}
      />
    </div>
  );
}
