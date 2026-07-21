"use client";

import { QueryProvider } from "@/lib/query/QueryProvider";
import { ColorSchemeProvider } from "@/components/ColorSchemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ColorSchemeProvider>
        {children}
      </ColorSchemeProvider>
    </QueryProvider>
  );
}
