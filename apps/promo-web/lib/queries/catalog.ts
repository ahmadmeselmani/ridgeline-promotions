import { useQuery } from "@tanstack/react-query";
import type { ProductResponse } from "@ridgeline/contracts/products";
import type { ScenarioResponse } from "@ridgeline/contracts/scenarios";
import type { StaffMemberResponse } from "@ridgeline/contracts/staff";
import type { VenueResponse } from "@ridgeline/contracts/venues";
import { apiFetch } from "../api-client";

// Reference data barely changes during a session.
const STATIC = { staleTime: 5 * 60_000 } as const;

export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: () => apiFetch<VenueResponse[]>("/venues"),
    ...STATIC,
  });
}

export function useProducts(venueId: string | undefined) {
  return useQuery({
    queryKey: ["products", venueId],
    queryFn: () => apiFetch<ProductResponse[]>(`/products?venueId=${venueId}`),
    enabled: !!venueId,
    ...STATIC,
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: () => apiFetch<StaffMemberResponse[]>("/staff"),
    ...STATIC,
  });
}

export function useScenarios() {
  return useQuery({
    queryKey: ["scenarios"],
    queryFn: () => apiFetch<ScenarioResponse[]>("/scenarios"),
    ...STATIC,
  });
}
