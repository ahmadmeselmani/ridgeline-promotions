"use client";

import { ArrowDown, ArrowUp, Equal } from "lucide-react";
import type { QuoteRequestInput } from "@ridgeline/contracts/pricing";
import { cn } from "@ridgeline/ui/lib/utils";
import { formatCents } from "../../lib/format";
import { useQuote } from "../../lib/queries/pricing";

// The one-sentence answer, so nobody has to compare two receipts to get it.
// Shares React Query cache entries with the receipts below: no extra requests.
export function AnswerBanner({
  request,
  showDraft,
}: {
  request: Omit<QuoteRequestInput, "rulebook">;
  showDraft: boolean;
}) {
  const today = useQuote({ ...request, rulebook: "legacy" });
  const next = useQuote({ ...request, rulebook: "live" });
  const draft = useQuote(showDraft ? { ...request, rulebook: "draft" } : null);

  if (!today.data || !next.data) return null;
  const delta = next.data.totalCents - today.data.totalCents;
  const Icon = delta < 0 ? ArrowDown : delta > 0 ? ArrowUp : Equal;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        delta < 0 && "border-success/40 bg-success/10",
        delta > 0 && "border-destructive/40 bg-destructive/10",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted",
          delta < 0 && "bg-success text-success-foreground",
          delta > 0 && "bg-destructive text-destructive-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="space-y-0.5">
        <p className="text-base">
          Under the new rules this order costs{" "}
          <strong className="tabular-nums">{formatCents(next.data.totalCents)}</strong>
          {delta === 0 ? (
            <> — the same as today.</>
          ) : (
            <>
              {" "}
              — <strong className="tabular-nums">{formatCents(Math.abs(delta))}</strong>{" "}
              {delta < 0 ? "less" : "more"} than today&apos;s till ({formatCents(today.data.totalCents)}).
            </>
          )}
        </p>
        {showDraft && draft.data && draft.data.totalCents !== next.data.totalCents ? (
          <p className="text-sm text-muted-foreground">
            Your unpublished draft would charge{" "}
            <strong className="tabular-nums text-foreground">{formatCents(draft.data.totalCents)}</strong>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
