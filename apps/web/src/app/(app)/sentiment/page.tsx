"use client";

import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { useSentiment } from "@/features/sentiment/api";
import { SentimentBar } from "@/features/sentiment/components/SentimentBar";
import { Activity } from "lucide-react";

export default function SentimentPage() {
  const { data, isLoading, isError, refetch } = useSentiment();

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <Panel title="市场情绪">
          <SkeletonPanel lines={10} />
        </Panel>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="情绪数据不可用"
        description="市场情绪指数暂时不可用，请稍后重试。"
        onRetry={() => refetch()}
      />
    );
  }

  const avg = data.items.length
    ? data.items.reduce((a, b) => a + b.score, 0) / data.items.length
    : 0;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-tight">市场情绪</h1>
        <p className="mt-0.5 text-sm text-text-muted">
          新闻与社媒聚合情绪指数（确定性快照，真实数据管线 P2 接入）
        </p>
      </div>

      {/* 市场级真实情绪（CNN Fear & Greed） */}
      <Panel
        title="市场情绪（CNN Fear & Greed）"
        {...(data.market.updatedAt
          ? { subtitle: `更新于 ${new Date(data.market.updatedAt).toLocaleTimeString("zh-CN", { hour12: false })}` }
          : {})}
        tools={
          <Badge tone={data.market.score != null && data.market.score > 0.15 ? "bull" : data.market.score != null && data.market.score < -0.15 ? "bear" : "neutral"}>
            {data.market.source === "cnn" ? "真实" : "模拟"}
          </Badge>
        }
      >
        <div className="flex flex-wrap items-center gap-6">
          <div className="font-mono text-[40px] font-semibold leading-none tracking-tight text-bullish">
            {data.market.score != null ? `${Math.round(data.market.score * 100)}` : "—"}
            <span className="text-sm font-normal text-text-muted"> / 100</span>
          </div>
          <div className="text-sm">
            <p className="text-text">{data.market.label}{data.market.rating ? `（${data.market.rating}）` : ""}</p>
            <p className="mt-0.5 text-xs text-text-muted">
              0=极度恐慌 · 50=中性 · 100=极度贪婪
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        title="情绪指数"
        subtitle={`${data.total} 个标的 · ${new Date(data.generatedAt).toLocaleTimeString("zh-CN", { hour12: false })} 更新`}
        tools={
          <Badge tone={avg > 0.1 ? "bull" : avg < -0.1 ? "bear" : "neutral"}>
            {avg > 0.1 ? "偏多" : avg < -0.1 ? "偏空" : "中性"}
          </Badge>
        }
      >
        <div className="flex flex-col gap-4">
          {data.items.map((item) => (
            <SentimentBar key={item.symbol} item={item} />
          ))}
        </div>
      </Panel>

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：情绪指数仅为市场氛围参考，不构成投资建议。极端情绪可能意味着反向风险。
      </p>
    </div>
  );
}


