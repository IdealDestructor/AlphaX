export interface PositionCalculatorInput {
  balance: number;
  riskPercent: number;
  entry: number;
  stopLoss: number;
  takeProfit?: number | null;
  symbol?: string;
}

export interface PositionCalculatorResult {
  symbol?: string;
  balance: number;
  riskPercent: number;
  riskAmount: number;
  entry: number;
  stopLoss: number;
  takeProfit: number | null;
  qty: number;
  positionValue: number;
  riskPerUnit: number;
  tickSize: number;
  rr: number | null;
  /** 入参非法时后端返回 { error } */
  error?: string;
}
