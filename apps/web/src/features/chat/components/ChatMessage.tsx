import { cn } from "@/lib/cn";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "../types";

export function ChatMessageBubble({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-sm border text-xs",
          isUser
            ? "border-accent/40 bg-accent/10 text-accent"
            : isSystem
              ? "border-warning/40 bg-warning/10 text-warning"
              : "border-border bg-bg-elevated text-text-secondary",
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={cn("flex max-w-[75%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-sm px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-accent/10 text-text"
              : isSystem
                ? "bg-warning/5 border border-warning/20 text-text-secondary"
                : "bg-bg-panel border border-border text-text",
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        <div className="flex items-center gap-3 px-1">
          {message.sources && message.sources.length > 0 && (
            <details className="group cursor-pointer">
              <summary className="font-mono text-[10px] text-text-muted hover:text-text-secondary">
                {message.sources.length} 个证据源
              </summary>
              <div className="mt-1 flex flex-col gap-1">
                {message.sources.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-sm bg-bg-elevated/50 px-2 py-1"
                  >
                    <span className="font-mono text-[10px] font-medium text-accent">
                      {s.agent}
                    </span>
                    <span className="text-[10px] text-text-muted">{s.signal}</span>
                    <span className="ml-auto font-mono text-[10px] text-text-muted">
                      w={s.weight.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <span className="ml-auto font-mono text-[10px] text-text-muted">
            {new Date(message.timestamp).toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {message.model && (
            <span className="font-mono text-[10px] text-text-muted">
              {message.model}
            </span>
          )}

          {message.tokens && (
            <span className="font-mono text-[10px] text-text-muted">
              {message.tokens} tok
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
