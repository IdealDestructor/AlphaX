# AlphaX Frontend API Client

| 字段 | 值 |
|------|-----|
| Version | 1.0 |
| Status | Implemented |
| Companion | [API_SPEC.md](./API_SPEC.md) · [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) |

---

## Architecture

```
Feature api.ts (React Query hook)
  → featureIsMock() check ← NEXT_PUBLIC_MOCK env
    ├── true  → mock function (setTimeout + static data)
    └── false → apiClient.get/post/patch/delete
                  → fetch() + auth injection + 401 refresh
                    → NestJS API Gateway /v1
```

---

## Module Structure (`src/lib/api/`)

| File | Responsibility |
|------|---------------|
| `types.ts` | `ApiResponse<T>`, `ApiErrorBody`, `PaginatedResponse<T>` |
| `errors.ts` | `ApiError` class with code/status/details |
| `client.ts` | HTTP methods (`get/post/patch/delete`), auth header injection, 401 auto-refresh |
| `mock.ts` | `featureIsMock(feature)` — environment-driven mock switch |

## Auth (`src/lib/auth/`)

| File | Responsibility |
|------|---------------|
| `store.ts` | Module-level token holder (read from localStorage), subscribe/notify pattern |
| `AuthProvider.tsx` | React context wrapping store, provides `login/logout/isAuthenticated` |
| `index.ts` | Barrel exports |

### Token flow

```
1. login() → POST /auth/login → store access + refresh tokens
2. apiClient reads token from store → injects Authorization header
3. 401 response → POST /auth/refresh → retry original request
4. Refresh fails → tokenStore.clear() → user logged out
```

---

## Mock Switch

```
NEXT_PUBLIC_MOCK=1          → all features mock
NEXT_PUBLIC_MOCK=market     → only market mock (comma-sep list)
NEXT_PUBLIC_MOCK=0          → all real API (default for production)
```

### Feature keys

`dashboard`, `market`, `analysis`, `signals`, `forecast`, `news`, `alerts`, `settings`, `chat`

---

## Endpoint Mapping

| Feature | API Path | Method | Notes |
|---------|----------|--------|-------|
| Dashboard | `/dashboard/{symbol}` | GET | BFF aggregate |
| Market | `/market/{symbol}` | GET | candles + quote + indicators |
| Analysis | `/analysis/{symbol}` | GET | latest analysis |
| | `/analysis/{symbol}/history` | GET | history (assembled into page data) |
| | `/analysis/{symbol}/refresh` | POST | force regenerate + persist |
| | `/signals/stats` | GET | accuracy aggregate for analysis page |
| Signals | `/signals` | GET | list + stats |
| Forecast | `/forecast/{symbol}` | GET | probability forecast |
| News | `/news` | GET | backend DB (mapped); RSS proxy kept as fallback |
| Alerts | `/alerts` | GET | list |
| | `/alerts` | POST | create |
| | `/alerts/{id}` | PATCH | update |
| | `/alerts/{id}` | DELETE | delete |
| Settings | `/me` | GET | profile + prefs |
| | `/me` | PATCH | update prefs |
| Chat | `/chat/sessions` | GET | session list |
| | `/chat/messages` | POST | non-streaming send (mock mode) |
| | `/chat/stream` | POST | SSE streaming send (real mode) |
| Auth | `/auth/login` | POST | email login |
| | `/auth/register` | POST | email signup (AuthProvider.register) |
| | `/auth/oauth/{provider}` | GET | OAuth redirect (via apiUrl) |
| | `/auth/refresh` | POST | token refresh |

---

## React Query Config

| Hook | staleTime | refetchInterval | Notes |
|------|-----------|----------------|-------|
| `useDashboard` | 60s | — | BFF, SSR-friendly |
| `useMarketData` | 15s | 15s | High-frequency polling |
| `useAnalysis` | 120s | — | Slow-changing |
| `useSignals` | 30s | — | Moderate frequency |
| `useForecast` | 60s | — | Moderate frequency |
| `useNews` | 60s | — | RSS-backed |
| `useAlerts` | 30s | — | User-specific |
| `useSettings` | 300s | — | Very low frequency |
| `useChatPageData` | 30s | — | Session list |

### Chat streaming

Real (non-mock) chat uses `useSendMessageStream`, which POSTs to `/chat/stream`
and consumes the SSE body (`data: {"token":"…"}` frames) token-by-token,
updating the assistant message in the React Query cache incrementally. Mock mode
keeps the instant non-streaming path (`useSendMessage`).

---

## Related

- [API_SPEC.md](./API_SPEC.md) — Backend API endpoints and schemas
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) — System architecture
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) — Local development setup
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) — Technical decision records

