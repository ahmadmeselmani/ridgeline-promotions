"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { ImpactResponse } from "@ridgeline/contracts/pricing";
import { Badge } from "@ridgeline/ui/badge";
import { Button } from "@ridgeline/ui/button";
import { cn } from "@ridgeline/ui/lib/utils";
import { RULEBOOK_LABEL, formatCents, formatDelta } from "../lib/format";
import { Receipt } from "./receipt";

export function ImpactList({ impact, emptyText }: { impact: ImpactResponse; emptyText: string }) {
  const [open, setOpen] = useState<string | null>(null);

  if (impact.changed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyText} ({impact.scenarioCount} till situations checked.)
      </p>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="w-4" />
        <span className="flex-1">Situation</span>
        <span>
          {RULEBOOK_LABEL[impact.from]} → {RULEBOOK_LABEL[impact.to]}
        </span>
        <span className="w-28 text-end">Customer pays</span>
      </div>
      {impact.changed.map((item) => {
        const expanded = open === item.scenarioId;
        return (
          <div key={item.scenarioId}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : item.scenarioId)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm hover:bg-muted/50"
            >
              <ChevronDown className={cn("size-4 shrink-0 transition-transform", !expanded && "-rotate-90")} />
              <span className="flex-1 font-medium">{item.title}</span>
              <span className="flex items-center gap-2 tabular-nums">
                <span className="text-muted-foreground">{formatCents(item.before.totalCents)}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{formatCents(item.after.totalCents)}</span>
              </span>
              <span className="flex w-28 justify-end">
                <Badge variant={item.deltaCents > 0 ? "destructive" : item.deltaCents < 0 ? "success" : "secondary"}>
                  {formatDelta(item.deltaCents)}
                </Badge>
              </span>
            </button>
            {expanded ? (
              <div className="grid gap-3 bg-muted/30 p-3 md:grid-cols-2">
                <Receipt title={RULEBOOK_LABEL[impact.from]} quote={item.before} tone="muted" />
                <Receipt title={RULEBOOK_LABEL[impact.to]} quote={item.after} />
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="px-3 py-2 text-xs text-muted-foreground">
        {impact.changed.length} of {impact.scenarioCount} situations change price. The rest stay the same.{" "}
        <Button variant="link" size="xs" className="h-auto p-0" onClick={() => setOpen(null)}>
          Collapse all
        </Button>
      </div>
    </div>
  );
}
