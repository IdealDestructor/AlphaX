export interface ApiMeta {
  request_id: string;
  timestamp: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
  error: null;
}

export interface ApiErrorResponse {
  data: null;
  meta: ApiMeta;
  error: ApiErrorBody;
}

export interface PaginatedResponse<T> {
  items: T[];
  next_cursor?: string;
}
