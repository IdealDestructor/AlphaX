"use client";

import { QueryProvider } from "@/lib/query/QueryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
