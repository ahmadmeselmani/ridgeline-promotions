import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateOverrideInput,
  OverrideResponse,
  OverrideSummary,
} from "@ridgeline/contracts/overrides";
import { apiFetch, apiPost } from "../api-client";

export function useOverrides() {
  return useQuery({
    queryKey: ["overrides"],
    queryFn: () => apiFetch<OverrideResponse[]>("/overrides"),
  });
}

export function useOverrideSummary() {
  return useQuery({
    queryKey: ["overrides", "summary"],
    queryFn: () => apiFetch<OverrideSummary>("/overrides/summary"),
  });
}

export function useCreateOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOverrideInput) => apiPost<OverrideResponse>("/overrides", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["overrides"] }),
  });
}
