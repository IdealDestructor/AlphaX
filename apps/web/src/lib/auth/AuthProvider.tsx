"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { tokenStore } from "./store";
import { apiClient, apiUrl } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  plan: "free" | "pro" | "enterprise";
  role: string;
  currency?: string;
  colorScheme?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithOAuth: (provider: string) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const applyAuth = useCallback(
    (res: AuthTokenResponse) => {
      tokenStore.setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      // 清除匿名期可能残留的 401 错误缓存
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    [queryClient],
  );

  const refreshProfile = useCallback(async (): Promise<AuthUser | null> => {
    if (!tokenStore.getAccessToken()) return null;
    try {
      const me = await apiClient.get<AuthUser>("/auth/me");
      setUser(me);
      return me;
    } catch {
      tokenStore.clear();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const tok = tokenStore.getAccessToken();
    if (tok) {
      apiClient
        .get<AuthUser>("/auth/me")
        .then(setUser)
        .catch(() => tokenStore.clear())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    const unsub = tokenStore.subscribe(() => {
      if (!tokenStore.getAccessToken()) setUser(null);
    });
    return unsub;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiClient.post<AuthTokenResponse>(
        "/auth/login",
        { email, password },
        { noAuth: true },
      );
      applyAuth(res);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await apiClient.post<AuthTokenResponse>(
        "/auth/register",
        { email, password, displayName },
        { noAuth: true },
      );
      applyAuth(res);
    },
    [applyAuth],
  );

  const loginWithOAuth = useCallback((provider: string) => {
    window.location.href = apiUrl(`/auth/oauth/${provider}`);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } catch {
      // 令牌可能已失效；仍要清空本地会话
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithOAuth,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
