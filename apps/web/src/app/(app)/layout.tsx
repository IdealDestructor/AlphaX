"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SymbolProvider } from "@/lib/symbol-context";
import { ChatUIProvider } from "@/lib/chat-ui-context";
import { ChatDrawer } from "@/features/chat/components/ChatDrawer";
import { ChatFab } from "@/features/chat/components/ChatFab";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <SymbolProvider>
      <ChatUIProvider>
        <div className="flex min-h-screen">
          <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onMenu={() => setNavOpen(true)} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</main>
          </div>
        </div>
        <ChatDrawer />
        <ChatFab />
      </ChatUIProvider>
    </SymbolProvider>
  );
}
