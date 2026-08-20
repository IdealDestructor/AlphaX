"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { login, loginWithOAuth, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm border border-border bg-bg-panel p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center bg-accent font-mono text-sm font-bold text-[#04120c]">AX</div>
          <div>
            <h1 className="text-base font-semibold text-text">登录 AlphaX</h1>
            <p className="text-xs text-text-muted">AI 驱动的黄金市场分析平台</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">邮箱</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">密码</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>
          <Button type="submit" variant="primary" disabled={submitting || isLoading} className="mt-1 w-full">
            {submitting ? "登录中…" : "登录"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-text-muted">
          <span className="h-px flex-1 bg-border" />或 <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => loginWithOAuth("google")}>
            Google
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={() => loginWithOAuth("github")}>
            GitHub
          </Button>
        </div>

        <p className="mt-5 text-center text-xs text-text-muted">
          还没有账号？{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
            免费注册
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <LoginForm />
    </Suspense>
  );
}
