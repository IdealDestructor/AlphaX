"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type {
  PlanInfo,
  UserEntitlements,
  CheckoutResult,
  OrderInfo,
} from "./types";

export function usePlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => apiClient.get<{ items: PlanInfo[] }>("/billing/plans", { noAuth: true }),
    staleTime: 300_000,
  });
}

export function useMyEntitlements(enabled = true) {
  return useQuery({
    queryKey: ["billing", "entitlements"],
    queryFn: () => apiClient.get<UserEntitlements>("/billing/entitlements"),
    enabled,
    staleTime: 60_000,
  });
}

export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => apiClient.get<{ subscription: UserEntitlements["subscription"]; entitlements: UserEntitlements }>("/billing/subscription"),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: "pro" | "enterprise") =>
      apiClient.post<CheckoutResult>("/billing/checkout", { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing", "entitlements"] });
    },
  });
}

export function useConfirmOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient.post<{ ok: boolean; plan: string }>(`/billing/orders/${orderId}/confirm`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing", "entitlements"] });
      qc.invalidateQueries({ queryKey: ["billing", "subscription"] });
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useGetOrder(enabled = true) {
  return useMutation({
    mutationFn: (orderId: string) => apiClient.get<OrderInfo>(`/billing/orders/${orderId}`),
  });
}

export function useActivateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (licenseKey: string) =>
      apiClient.post<{ ok: boolean; plan: string; alreadyActivated?: boolean }>(
        "/billing/license/activate",
        { licenseKey },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing", "entitlements"] });
      qc.invalidateQueries({ queryKey: ["billing", "subscription"] });
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: () => apiClient.get<{ portalUrl: string }>("/billing/portal"),
  });
}
