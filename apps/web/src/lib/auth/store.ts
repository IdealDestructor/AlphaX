const TOKEN_KEY = "alphax_access_token";
const REFRESH_KEY = "alphax_refresh_token";

type Listener = () => void;

let accessToken: string | null = null;
let refreshToken: string | null = null;
const listeners = new Set<Listener>();

function load() {
  if (typeof window === "undefined") return;
  accessToken = localStorage.getItem(TOKEN_KEY);
  refreshToken = localStorage.getItem(REFRESH_KEY);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export const tokenStore = {
  getAccessToken(): string | null {
    if (!accessToken) load();
    return accessToken;
  },

  getRefreshToken(): string | null {
    if (!refreshToken) load();
    return refreshToken;
  },

  setTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
    }
    notify();
  },

  clear() {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
    notify();
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};
