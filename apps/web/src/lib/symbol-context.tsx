"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface SymbolContextValue {
  currentSymbol: string;
  setCurrentSymbol: (symbol: string) => void;
}

const SymbolContext = createContext<SymbolContextValue | null>(null);

export function SymbolProvider({ children }: { children: ReactNode }) {
  const [currentSymbol, setCurrentSymbol] = useState("XAUUSD");

  return (
    <SymbolContext.Provider value={{ currentSymbol, setCurrentSymbol }}>
      {children}
    </SymbolContext.Provider>
  );
}

export function useSymbol() {
  const ctx = useContext(SymbolContext);
  if (!ctx) throw new Error("useSymbol must be used within SymbolProvider");
  return ctx;
}
