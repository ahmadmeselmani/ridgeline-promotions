import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  ClashGridResponse,
  ImpactResponse,
  QuoteRequestInput,
  QuoteResponse,
} from "@ridgeline/contracts/pricing";
import type { RulebookName } from "@ridgeline/contracts/rulebooks";
import { apiFetch, apiPost } from "../api-client";

// A quote is a pure calculation, so it's modelled as a query keyed on the
// request: change the basket and the receipt updates on its own.
export function useQuote(request: QuoteRequestInput | null) {
  return useQuery({
    queryKey: ["quote", request],
    queryFn: () => apiPost<QuoteResponse>("/pricing/quote", request),
    enabled: request !== null && request.lines.length > 0,
    placeholderData: keepPreviousData,
  });
}

export function useImpact(from: RulebookName, to: RulebookName, enabled = true) {
  return useQuery({
    queryKey: ["impact", from, to],
    queryFn: () => apiFetch<ImpactResponse>(`/pricing/impact?from=${from}&to=${to}`),
    enabled,
  });
}

export function useClashGrid(venueId: string | undefined, rulebook: RulebookName, weekOf: string) {
  return useQuery({
    queryKey: ["clash-grid", venueId, rulebook, weekOf],
    queryFn: () =>
      apiFetch<ClashGridResponse>(
        `/pricing/clash-grid?venueId=${venueId}&rulebook=${rulebook}&weekOf=${weekOf}`,
      ),
    enabled: !!venueId,
    placeholderData: keepPreviousData,
  });
}
