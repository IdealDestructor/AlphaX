"use client";

import { useEffect } from "react";
import { useSettings } from "@/features/settings/api";

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSettings();

  useEffect(() => {
    const scheme = data?.colorScheme ?? "international";
    document.documentElement.dataset.colorScheme = scheme;
  }, [data?.colorScheme]);

  return <>{children}</>;
}
