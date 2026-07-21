"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatPageDataMock } from "./mock";
import type { ChatPageData, ChatMessage } from "./types";

async function fetchChatPageData(): Promise<ChatPageData> {
  await new Promise((r) => setTimeout(r, 600));
  return {
    sessions: chatPageDataMock.sessions.map((s) => ({
      ...s,
      messages: s.messages.map((m) => ({ ...m })),
    })),
    currentSessionId: chatPageDataMock.currentSessionId,
  };
}

export function useChatPageData() {
  return useQuery({
    queryKey: ["chat"],
    queryFn: fetchChatPageData,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => {
      await new Promise((r) => setTimeout(r, 1200));

      const reply: ChatMessage = {
        id: `m_auto_${Date.now()}`,
        role: "assistant",
        content: `已收到您的消息：「${content}」\n\n当前模拟模式，智能分析管线尚未接入。您的提问已记录，正式上线后将调用多 Agent 融合分析引擎进行实时回答。\n\n*如需查看完整智能分析能力，请前往「智能分析」页面。*`,
        timestamp: new Date().toISOString(),
        tokens: 64,
        model: "fusion-v2.1-sim",
        sources: [],
      };

      return { sessionId, reply };
    },
    onSuccess: ({ sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
    },
  });
}
