export type JournalSide = "long" | "short";

export interface JournalEntry {
  id: string;
  symbol: string;
  side: JournalSide;
  entryPrice: number | null;
  exitPrice: number | null;
  qty: number | null;
  profit: number | null;
  note: string;
  tags: string[];
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface JournalPageData {
  items: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JournalStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
}

export interface CreateJournalPayload {
  /** 数据库 Symbol id（后端 CreateJournalDto 要求） */
  symbolId: string;
  side: JournalSide;
  entryPrice?: number | null;
  exitPrice?: number | null;
  qty?: number | null;
  profit?: number | null;
  note?: string;
  tags?: string[];
  openedAt?: string | null;
  closedAt?: string | null;
}

export interface UpdateJournalPayload {
  id: string;
  side?: JournalSide;
  entryPrice?: number | null;
  exitPrice?: number | null;
  qty?: number | null;
  profit?: number | null;
  note?: string;
  tags?: string[];
  openedAt?: string | null;
  closedAt?: string | null;
}
