"use client";

import type { QuoteRequestInput } from "@ridgeline/contracts/pricing";
import type { RulebookName } from "@ridgeline/contracts/rulebooks";
import { RULEBOOK_HINT, RULEBOOK_LABEL } from "../../lib/format";
import { useQuote } from "../../lib/queries/pricing";
import { LoadingBlock, QueryError } from "../query-state";
import { Receipt } from "../receipt";

export function RulebookReceipt({
  rulebook,
  request,
}: {
  rulebook: RulebookName;
  request: Omit<QuoteRequestInput, "rulebook">;
}) {
  const quote = useQuote({ ...request, rulebook });
  if (quote.isPending) return <LoadingBlock className="h-64" />;
  if (quote.isError) return <QueryError error={quote.error} />;
  return (
    <Receipt
      title={RULEBOOK_LABEL[rulebook]}
      subtitle={`${RULEBOOK_HINT[rulebook]} · ${quote.data.customer.label}`}
      quote={quote.data}
      tone={rulebook === "legacy" ? "muted" : "default"}
      className={quote.isPlaceholderData ? "opacity-60" : undefined}
    />
  );
}
