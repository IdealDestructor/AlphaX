"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SkeletonPanel } from "@/components/state/States";

/**
 * 页面级鉴权守卫：未登录时跳转 /login?next=…。
 * 用于 /settings、/billing 等需要登录的页面。
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <SkeletonPanel lines={8} />
      </div>
    );
  }

  return <>{children}</>;
}
