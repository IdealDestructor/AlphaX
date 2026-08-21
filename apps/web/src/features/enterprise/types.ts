export interface EnterpriseApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export interface EnterpriseApiKeyCreated extends EnterpriseApiKey {
  key: string;
  note?: string;
}
