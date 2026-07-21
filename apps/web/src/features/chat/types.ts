export type MessageRole = "user" | "assistant" | "system";

export interface SourceRef {
  agent: string;
  signal: string;
  weight: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  tokens?: number;
  sources?: SourceRef[];
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  symbol: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  model: string;
  messageCount: number;
}

export interface ChatPageData {
  sessions: ChatSession[];
  currentSessionId: string;
}
