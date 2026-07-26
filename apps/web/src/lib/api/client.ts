import { tokenStore } from "@/lib/auth/store";
import { ApiError } from "./errors";
import type { ApiResponse, ApiErrorResponse } from "./types";

export type { ApiResponse };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const DEFAULT_TIMEOUT = 15_000;

interface RequestOptions {
  method?: string;
  path: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  timeout?: number;
  headers?: Record<string, string>;
  /** Skip auth header — for login/register/public endpoints */
  noAuth?: boolean;
}

async function resolveResponse(opts: RequestOptions): Promise<Response> {
  const {
    method = "GET",
    path,
    body,
    params,
    timeout = DEFAULT_TIMEOUT,
    headers = {},
    noAuth = false,
  } = opts;

  const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(cleanPath, base);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const token = tokenStore.getAccessToken();
  if (token && !noAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : null,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as unknown as T;

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("PARSE_ERROR", "Invalid JSON response", res.status);
  }

  if (!res.ok) {
    const errBody = json as ApiErrorResponse;
    throw ApiError.fromResponse(res.status, errBody.error ?? {});
  }

  const successBody = json as ApiResponse<T>;
  return successBody.data;
}

async function doRefresh(): Promise<boolean> {
  const refresh = tokenStore.getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) { tokenStore.clear(); return false; }
    const json = await res.json();
    const body = json as ApiResponse<{ access_token: string; refresh_token: string }>;
    tokenStore.setTokens(body.data.access_token, body.data.refresh_token);
    return true;
  } catch {
    tokenStore.clear();
    return false;
  }
}

export function apiUrl(path: string): string {
  const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  return `${base}${path}`;
}

export const apiClient = {
  async get<T>(path: string, opts?: { params?: Record<string, string | number | undefined>; timeout?: number; noAuth?: boolean }): Promise<T> {
    const doFetch = async () => {
      const res = await resolveResponse({ method: "GET", path, ...opts });
      return parseResponse<T>(res);
    };
    try { return await doFetch(); }
    catch (err) {
      if (ApiError.isApiError(err) && err.status === 401 && !opts?.noAuth && await doRefresh()) return doFetch();
      throw err;
    }
  },

  async post<T>(path: string, body?: unknown, opts?: { timeout?: number; noAuth?: boolean }): Promise<T> {
    const doFetch = async () => {
      const res = await resolveResponse({ method: "POST", path, body, ...opts });
      return parseResponse<T>(res);
    };
    try { return await doFetch(); }
    catch (err) {
      if (ApiError.isApiError(err) && err.status === 401 && !opts?.noAuth && await doRefresh()) return doFetch();
      throw err;
    }
  },

  async patch<T>(path: string, body?: unknown, opts?: { timeout?: number }): Promise<T> {
    const doFetch = async () => {
      const res = await resolveResponse({ method: "PATCH", path, body, ...opts });
      return parseResponse<T>(res);
    };
    try { return await doFetch(); }
    catch (err) {
      if (ApiError.isApiError(err) && err.status === 401 && await doRefresh()) return doFetch();
      throw err;
    }
  },

  async delete<T>(path: string, opts?: { timeout?: number }): Promise<T> {
    const doFetch = async () => {
      const res = await resolveResponse({ method: "DELETE", path, ...opts });
      return parseResponse<T>(res);
    };
    try { return await doFetch(); }
    catch (err) {
      if (ApiError.isApiError(err) && err.status === 401 && await doRefresh()) return doFetch();
      throw err;
    }
  },
};
