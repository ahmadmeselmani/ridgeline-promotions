import { CircleSlash, Info, Layers, Package } from "lucide-react";
import type { PricedLine, QuoteResponse } from "@ridgeline/contracts/pricing";
import { Badge } from "@ridgeline/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ridgeline/ui/card";
import { Separator } from "@ridgeline/ui/separator";
import { cn } from "@ridgeline/ui/lib/utils";
import { formatCents } from "../lib/format";

// A till receipt that shows its working: every deal given, and every deal
// that was considered and why it didn't apply.
export function Receipt({
  title,
  subtitle,
  quote,
  tone = "default",
  className,
}: {
  title: string;
  subtitle?: string;
  quote: QuoteResponse;
  tone?: "default" | "muted";
  className?: string;
}) {
  return (
    <Card className={cn("gap-3", tone === "muted" && "bg-muted/40", className)}>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between gap-2">
          <span>{title}</span>
          <span className="text-2xl font-semibold tabular-nums">{formatCents(quote.totalCents)}</span>
        </CardTitle>
        <CardDescription>
          {subtitle ?? `${quote.customer.label} · ${quote.venueName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {quote.lines.map((line, index) => (
          <ReceiptLine key={`${line.productId}-${line.bundleGroup ?? "x"}-${index}`} line={line} />
        ))}
        <Separator />
        <div className="space-y-1 text-sm tabular-nums">
          <Row label="Menu price" value={formatCents(quote.subtotalCents)} />
          <Row
            label="Deals"
            value={quote.discountCents > 0 ? `-${formatCents(quote.discountCents)}` : "—"}
            className="text-success"
          />
          <Row label="To pay" value={formatCents(quote.totalCents)} className="font-semibold" />
        </div>
        {quote.notes.length > 0 ? (
          <div className="space-y-1">
            {quote.notes.map((note) => (
              <p key={note} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {note}
              </p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReceiptLine({ line }: { line: PricedLine }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>
          <span className="text-muted-foreground tabular-nums">{line.quantity}×</span> {line.name}
        </span>
        <span className="flex items-baseline gap-2 tabular-nums">
          {line.discountCents > 0 ? (
            <span className="text-xs text-muted-foreground line-through">{formatCents(line.listCents)}</span>
          ) : null}
          <span className="font-medium">{formatCents(line.finalCents)}</span>
        </span>
      </div>
      {line.applied.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {line.applied.map((applied) => (
            <Badge
              key={`${applied.promotionId}-${applied.role}`}
              variant={applied.role === "stacked" ? "warning" : "success"}
            >
              {applied.role === "bundle" ? <Package /> : applied.role === "stacked" ? <Layers /> : null}
              {applied.name}
              {applied.role === "stacked" ? " (extra, on top)" : ""} −{formatCents(applied.discountCents)}
            </Badge>
          ))}
        </div>
      ) : null}
      {line.skipped.length > 0 ? (
        <div className="rounded-md bg-muted/50 px-2 py-1.5">
          <p className="mb-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Not applied</p>
          <ul className="space-y-0.5">
            {line.skipped.map((skipped) => (
              <li key={skipped.promotionId} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <CircleSlash className="mt-0.5 size-3 shrink-0" />
                <span>
                  <span className="font-medium text-foreground/80">{skipped.name}</span>: {skipped.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

// Explains the badge colours once, under the receipts.
export function ReceiptLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Badge variant="success">Deal</Badge> the one deal this item got
      </span>
      <span className="flex items-center gap-1.5">
        <Badge variant="success">
          <Package /> Deal
        </Badge>{" "}
        part of a bundle
      </span>
      <span className="flex items-center gap-1.5">
        <Badge variant="warning">
          <Layers /> Deal
        </Badge>{" "}
        a second discount on the same item
      </span>
      <span className="flex items-center gap-1.5">
        <CircleSlash className="size-3" /> a deal that was considered, and why it didn&apos;t apply
      </span>
    </div>
  );
}
