"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { register, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, displayName || undefined);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "注册失败，请稍后重试");
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
            <h1 className="text-base font-semibold text-text">注册 AlphaX</h1>
            <p className="text-xs text-text-muted">免费开始，随时升级 Pro / Enterprise</p>
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
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">昵称（可选）</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              placeholder="你的昵称"
              autoComplete="nickname"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">密码（至少 6 位）</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">确认密码</span>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>
          <Button type="submit" variant="primary" disabled={submitting || isLoading} className="mt-1 w-full">
            {submitting ? "注册中…" : "注册并登录"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-text-muted">
          已有账号？{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
            直接登录
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <RegisterForm />
    </Suspense>
  );
}
