import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePromotionInput,
  PromotionResponse,
  UpdatePromotionInput,
} from "@ridgeline/contracts/promotions";
import type {
  PricingPolicy,
  RulebookName,
  RulebookResponse,
  RulebookSummary,
} from "@ridgeline/contracts/rulebooks";
import { apiDelete, apiFetch, apiPatch, apiPost } from "../api-client";

// Anything that edits rules can change every price, so refresh all of it.
function useInvalidateRules() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rulebooks"] }),
      queryClient.invalidateQueries({ queryKey: ["rulebook"] }),
      queryClient.invalidateQueries({ queryKey: ["quote"] }),
      queryClient.invalidateQueries({ queryKey: ["impact"] }),
      queryClient.invalidateQueries({ queryKey: ["clash-grid"] }),
    ]);
}

export function useRulebooks() {
  return useQuery({
    queryKey: ["rulebooks"],
    queryFn: () => apiFetch<RulebookSummary[]>("/rulebooks"),
  });
}

export function useRulebook(name: RulebookName) {
  return useQuery({
    queryKey: ["rulebook", name],
    queryFn: () => apiFetch<RulebookResponse>(`/rulebooks/${name}`),
  });
}

export function usePublishDraft() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: () => apiPost<RulebookResponse>("/rulebooks/draft/publish"),
    onSuccess: invalidate,
  });
}

export function useDiscardDraft() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: () => apiPost<RulebookResponse>("/rulebooks/draft/discard"),
    onSuccess: invalidate,
  });
}

export function useUpdateDraftPolicy() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: (policy: PricingPolicy) =>
      apiPatch<RulebookResponse>("/rulebooks/draft/policy", policy),
    onSuccess: invalidate,
  });
}

export function useCreatePromotion() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: (input: CreatePromotionInput) =>
      apiPost<PromotionResponse>("/promotions", input),
    onSuccess: invalidate,
  });
}

export function useUpdatePromotion() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: ({ promotionId, input }: { promotionId: string; input: UpdatePromotionInput }) =>
      apiPatch<PromotionResponse>(`/promotions/${promotionId}`, input),
    onSuccess: invalidate,
  });
}

export function useDeletePromotion() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: (promotionId: string) => apiDelete(`/promotions/${promotionId}`),
    onSuccess: invalidate,
  });
}
