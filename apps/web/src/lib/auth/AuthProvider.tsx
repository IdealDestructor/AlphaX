"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { tokenStore } from "./store";
import { apiClient, apiUrl } from "@/lib/api/client";
import type { ReactNode } from "react";

interface User {
  id: string;
  email: string;
  plan: "free" | "pro" | "enterprise";
}

interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithOAuth: (provider: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const tok = tokenStore.getAccessToken();
    if (tok) {
      apiClient.get<User>("/auth/me").then(setUser).catch(() => tokenStore.clear());
    }
    const unsub = tokenStore.subscribe(() => {
      if (!tokenStore.getAccessToken()) setUser(null);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<AuthTokenResponse>(
      "/auth/login",
      { email, password },
      { noAuth: true },
    );
    tokenStore.setTokens(res.accessToken, res.refreshToken);
    setUser(await apiClient.get<User>("/auth/me"));
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await apiClient.post<{ access_token: string; refresh_token: string; user: User }>(
      "/auth/register",
      { email, password, displayName },
      { noAuth: true },
    );
    tokenStore.setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
  }, []);

  const loginWithOAuth = useCallback((_provider: string) => {
    window.location.href = `${apiUrl("/auth/oauth/" + _provider)}`;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, loginWithOAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
