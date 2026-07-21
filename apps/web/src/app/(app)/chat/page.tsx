"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatUI } from "@/lib/chat-ui-context";

/** 兼容旧路由：打开右侧对话浮窗并回到首页 */
export default function ChatPage() {
  const router = useRouter();
  const { openChat } = useChatUI();

  useEffect(() => {
    openChat();
    router.replace("/");
  }, [openChat, router]);

  return null;
}
