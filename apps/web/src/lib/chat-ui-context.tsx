"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ChatUIContextValue {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatUIContext = createContext<ChatUIContextValue | null>(null);

export function ChatUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => setOpen(false), []);
  const toggleChat = useCallback(() => setOpen((v) => !v), []);

  return (
    <ChatUIContext.Provider value={{ open, openChat, closeChat, toggleChat }}>
      {children}
    </ChatUIContext.Provider>
  );
}

export function useChatUI() {
  const ctx = useContext(ChatUIContext);
  if (!ctx) throw new Error("useChatUI must be used within ChatUIProvider");
  return ctx;
}
