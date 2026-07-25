"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChartColors {
  text: string;
  grid: string;
  up: string;
  down: string;
  volUp: string;
  volDown: string;
  crosshair: string;
  ma20: string;
  ma50: string;
}

function readCSSVar(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function readChartColors(): ChartColors {
  return {
    text: readCSSVar("--text-muted") || "#6b7689",
    grid: readCSSVar("--border") || "#1e2633",
    up: readCSSVar("--bullish") || "#22c55e",
    down: readCSSVar("--bearish") || "#ef4444",
    volUp: (readCSSVar("--bullish") || "#22c55e") + "33",
    volDown: (readCSSVar("--bearish") || "#ef4444") + "33",
    crosshair: readCSSVar("--accent") || "#3ecf8e",
    ma20: readCSSVar("--warning") || "#f59e0b",
    ma50: readCSSVar("--focus") || "#5b9fd4",
  };
}

export function useColorScheme() {
  const [scheme, setScheme] = useState<string>("international");
  const [chartColors, setChartColors] = useState<ChartColors>(readChartColors);

  const refresh = useCallback(() => {
    setChartColors(readChartColors());
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    const current = el.dataset.colorScheme ?? "international";
    setScheme(current);

    const observer = new MutationObserver(() => {
      const next = el.dataset.colorScheme ?? "international";
      setScheme(next);
      setChartColors(readChartColors());
    });

    observer.observe(el, { attributes: true, attributeFilter: ["data-color-scheme"] });
    return () => observer.disconnect();
  }, [refresh]);

  return { scheme, chartColors, refresh };
}
