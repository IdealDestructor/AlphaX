"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { chatPageDataMock } from "./mock";
import type { ChatPageData, ChatMessage, ChatSession } from "./types";

interface BackendMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface BackendSession {
  id: string;
  title: string;
  symbol: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
}

function mapMessage(raw: BackendMessage): ChatMessage {
  return {
    id: raw.id,
    role: raw.role,
    content: raw.content,
    timestamp: raw.createdAt,
  };
}

function mapSession(raw: BackendSession): ChatSession {
  return {
    id: raw.id,
    title: raw.title || "新对话",
    symbol: raw.symbol || "XAUUSD",
    messages: [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    model: raw.model ?? "fusion-v2.1",
    messageCount: 0,
  };
}

async function fetchChatPageData(): Promise<ChatPageData> {
  if (featureIsMock("chat")) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      sessions: chatPageDataMock.sessions.map((s) => ({
        ...s,
        messages: s.messages.map((m) => ({ ...m })),
      })),
      currentSessionId: chatPageDataMock.currentSessionId,
    };
  }
  const sessions = await apiClient.get<BackendSession[]>("/chat/sessions");
  return {
    sessions: sessions.map(mapSession),
    currentSessionId: sessions[0]?.id ?? "",
  };
}

export function useChatPageData() {
  return useQuery({
    queryKey: ["chat"],
    queryFn: fetchChatPageData,
    staleTime: 30_000,
  });
}

interface SendMessageInput {
  sessionId: string;
  content: string;
}

interface SendMessageResult {
  sessionId: string;
  reply: ChatMessage;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  function withUserMessage(sessionId: string, content: string) {
    return () => {
      queryClient.setQueryData<ChatPageData>(["chat"], (prev) => {
        if (!prev) return prev;
        const userMsg: ChatMessage = {
          id: `optimistic_${Date.now()}`,
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        };
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messageCount: s.messageCount + 1,
                  updatedAt: userMsg.timestamp,
                  messages: [...s.messages, userMsg],
                }
              : s,
          ),
        };
      });
    };
  }

  return useMutation({
    mutationFn: async ({ sessionId, content }: SendMessageInput): Promise<SendMessageResult> => {
      if (featureIsMock("chat")) {
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
      }

      const reply = await apiClient.post<BackendMessage>(
        "/chat/messages",
        { content, sessionId },
      );
      return { sessionId: reply.id, reply: mapMessage(reply) };
    },
    onMutate: ({ sessionId, content }) => {
      withUserMessage(sessionId, content)();
    },
    onSuccess: ({ sessionId, reply }) => {
      queryClient.setQueryData<ChatPageData>(["chat"], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messageCount: s.messageCount + 1,
                  updatedAt: reply.timestamp,
                  messages: [...s.messages, reply],
                }
              : s,
          ),
        };
      });
    },
  });
}
