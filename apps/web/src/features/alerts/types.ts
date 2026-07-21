export type AlertType = "price" | "ai" | "news" | "indicator";
export type AlertOp = "cross_above" | "cross_below" | "above" | "below" | "change_pct";
export type AlertChannel = "email" | "web_push" | "telegram";
export type AlertStatus = "active" | "paused" | "triggered" | "expired";

export interface AlertCondition {
  op: AlertOp;
  price?: number;
  changePct?: number;
  period?: string;
}

export interface PriceAlert {
  id: string;
  type: AlertType;
  symbol: string;
  condition: AlertCondition;
  channels: AlertChannel[];
  status: AlertStatus;
  note: string;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertsPageData {
  alerts: PriceAlert[];
  availableSymbols: string[];
  availableChannels: AlertChannel[];
}

export interface CreateAlertPayload {
  type: AlertType;
  symbol: string;
  condition: AlertCondition;
  channels: AlertChannel[];
  note?: string | undefined;
}

export interface UpdateAlertPayload {
  id: string;
  condition?: AlertCondition;
  channels?: AlertChannel[];
  status?: AlertStatus;
  note?: string;
}
