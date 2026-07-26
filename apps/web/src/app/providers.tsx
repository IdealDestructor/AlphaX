"use client";

import { QueryProvider } from "@/lib/query/QueryProvider";
import { ColorSchemeProvider } from "@/components/ColorSchemeProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ColorSchemeProvider>
          {children}
        </ColorSchemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
