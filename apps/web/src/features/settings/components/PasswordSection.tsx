"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useUpdatePassword } from "@/features/settings/api";
import { ApiError } from "@/lib/api/errors";

export function PasswordSection() {
  const updatePassword = useUpdatePassword();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword.length < 6) {
      setMsg({ ok: false, text: "新密码至少 6 位" });
      return;
    }
    if (newPassword !== confirm) {
      setMsg({ ok: false, text: "两次输入的新密码不一致" });
      return;
    }
    try {
      await updatePassword.mutateAsync({ oldPassword, newPassword });
      setMsg({ ok: true, text: "密码已更新" });
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "修改失败" });
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3">
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">当前密码</span>
        <input
          type="password"
          required
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
          autoComplete="current-password"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">新密码（至少 6 位）</span>
        <input
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
          autoComplete="new-password"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">确认新密码</span>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
          autoComplete="new-password"
        />
      </label>
      {msg && <p className={`text-xs ${msg.ok ? "text-bullish" : "text-danger"}`}>{msg.text}</p>}
      <div>
        <Button type="submit" variant="primary" disabled={updatePassword.isPending}>
          {updatePassword.isPending ? "提交中…" : "更新密码"}
        </Button>
      </div>
    </form>
  );
}
