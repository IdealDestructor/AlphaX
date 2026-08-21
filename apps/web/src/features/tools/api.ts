"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import type { PositionCalculatorInput, PositionCalculatorResult } from "./types";

/** 本地即时预览（与后端 ToolsService 逻辑保持一致，提交后以后端为准） */
export function calculateLocally(input: PositionCalculatorInput): PositionCalculatorResult {
  const { balance, riskPercent, entry, stopLoss, takeProfit, symbol } = input;
  const riskAmount = balance * (riskPercent / 100);
  const riskPerUnit = Math.abs(entry - stopLoss);

  if (riskPerUnit === 0) {
    return {
      ...input,
      riskAmount: Math.round(riskAmount * 100) / 100,
      takeProfit: takeProfit ?? null,
      qty: 0,
      positionValue: 0,
      riskPerUnit: 0,
      tickSize: 0.01,
      rr: null,
      error: "止损价不能等于入场价",
    };
  }

  const qty = Math.round(riskAmount / riskPerUnit);
  const positionValue = qty * entry;
  const rr = takeProfit ? Math.round((Math.abs(takeProfit - entry) / riskPerUnit) * 100) / 100 : null;

  const result: PositionCalculatorResult = {
    balance,
    riskPercent,
    riskAmount: Math.round(riskAmount * 100) / 100,
    entry,
    stopLoss,
    takeProfit: takeProfit ?? null,
    qty,
    positionValue: Math.round(positionValue * 100) / 100,
    riskPerUnit: Math.round(riskPerUnit * 100) / 100,
    tickSize: 0.01,
    rr,
  };
  if (symbol) result.symbol = symbol;
  return result;
}

export function usePositionCalculator() {
  return useMutation({
    mutationFn: async (input: PositionCalculatorInput): Promise<PositionCalculatorResult> => {
      if (featureIsMock("tools")) return calculateLocally(input);
      return apiClient.post<PositionCalculatorResult>("/tools/position-calculator", input);
    },
  });
}

