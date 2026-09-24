"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import type { Customer } from "@ridgeline/contracts/pricing";
import type { RulebookName } from "@ridgeline/contracts/rulebooks";
import type { ScenarioResponse } from "@ridgeline/contracts/scenarios";
import { Badge } from "@ridgeline/ui/badge";
import { Button } from "@ridgeline/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ridgeline/ui/card";
import { Input } from "@ridgeline/ui/input";
import { Label } from "@ridgeline/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ridgeline/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@ridgeline/ui/toggle-group";
import { PageHeader } from "../../components/page-header";
import { LoadingBlock, QueryError } from "../../components/query-state";
import { ReceiptLegend } from "../../components/receipt";
import { AnswerBanner } from "../../components/simulator/answer-banner";
import { BasketPicker } from "../../components/simulator/basket-picker";
import { RulebookReceipt } from "../../components/simulator/rulebook-receipt";
import { RULEBOOK_HINT, RULEBOOK_LABEL } from "../../lib/format";
import { useProducts, useScenarios, useStaff, useVenues } from "../../lib/queries/catalog";
import { useRulebooks } from "../../lib/queries/rulebooks";

const KNOWN_MEMBERS = [
  { number: "M-004182", label: "Ray (gold)" },
  { number: "M-004183", label: "P. Nakamura" },
  { number: "M-003920", label: "T. Whelan (lapsed)" },
] as const;

interface Order {
  venueId: string;
  date: string;
  time: string;
  customer: Customer;
  basket: Record<string, number>;
}

function orderFromScenario(scenario: ScenarioResponse): Order {
  const [date = "", time = ""] = scenario.localDateTime.split("T");
  return {
    venueId: scenario.venueId,
    date,
    time,
    customer: scenario.customer,
    basket: Object.fromEntries(scenario.lines.map((line) => [line.productId, line.quantity])),
  };
}

const INITIAL_ORDER: Order = {
  venueId: "VEN-0233",
  date: "2026-09-22",
  time: "19:00",
  customer: { kind: "member", memberNumber: "M-004182" },
  basket: { "PRD-0201": 1, "PRD-0109": 1 },
};

export default function SimulatorPage() {
  const [order, setOrder] = useState<Order>(INITIAL_ORDER);
  const [compare, setCompare] = useState<RulebookName[]>(["legacy", "live"]);
  const [scenarioId, setScenarioId] = useState<string | null>("ray-tuesday");

  const venues = useVenues();
  const products = useProducts(order.venueId);
  const staff = useStaff();
  const scenarios = useScenarios();
  const rulebooks = useRulebooks();
  const draftDirty = rulebooks.data?.find((r) => r.name === "draft")?.hasUnpublishedChanges ?? false;

  const update = (patch: Partial<Order>) => {
    setScenarioId(null);
    setOrder((current) => ({ ...current, ...patch }));
  };

  const lines = Object.entries(order.basket).map(([productId, quantity]) => ({ productId, quantity }));
  const request = {
    venueId: order.venueId,
    localDateTime: `${order.date}T${order.time}`,
    customer: order.customer,
    lines,
  };
  const venue = venues.data?.find((candidate) => candidate.venueId === order.venueId);
  const scenario = scenarios.data?.find((candidate) => candidate.scenarioId === scenarioId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Price an order"
        description="What will the till charge, and why? Ring up any order at any venue and time."
        tip="Pick one of the situations below, or change the order on the left. The receipts update straight away."
      />

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" /> Situations from Tania&apos;s brief
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {scenarios.data?.map((candidate) => (
              <Button
                key={candidate.scenarioId}
                size="sm"
                variant={candidate.scenarioId === scenarioId ? "default" : "outline"}
                onClick={() => {
                  setScenarioId(candidate.scenarioId);
                  setOrder(orderFromScenario(candidate));
                }}
              >
                {candidate.title}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {scenario ? scenario.story : "Your own order — pick a situation above to go back to one from the brief."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-5">
            <Step number={1} title="Where and when">
              <Select value={order.venueId} onValueChange={(venueId) => update({ venueId })}>
                <SelectTrigger className="w-full" aria-label="Venue">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {venues.data?.map((candidate) => (
                    <SelectItem key={candidate.venueId} value={candidate.venueId}>
                      {candidate.name} · {candidate.state}
                      {candidate.kind === "bistro" ? " · bistro" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
                  <Input id="date" type="date" value={order.date} onChange={(e) => update({ date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="time" className="text-xs text-muted-foreground">Time at the venue</Label>
                  <Input id="time" type="time" value={order.time} onChange={(e) => update({ time: e.target.value })} />
                </div>
              </div>
              {venue ? (
                <p className="text-xs text-muted-foreground">
                  Local time in {venue.timezone.split("/")[1]}
                  {venue.kind === "bistro" ? " · bistro (assumed until Tania confirms)" : ""}
                </p>
              ) : null}
            </Step>

            <Step number={2} title="Who's buying">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={order.customer.kind}
                onValueChange={(kind) => {
                  if (kind === "guest") update({ customer: { kind: "guest" } });
                  if (kind === "member") update({ customer: { kind: "member", memberNumber: "M-004182" } });
                  if (kind === "staff") update({ customer: { kind: "staff", staffId: "STF-11" } });
                }}
              >
                <ToggleGroupItem value="guest">Walk-in</ToggleGroupItem>
                <ToggleGroupItem value="member">Member</ToggleGroupItem>
                <ToggleGroupItem value="staff">Staff</ToggleGroupItem>
              </ToggleGroup>
              {order.customer.kind === "member" ? (
                <div className="space-y-1.5">
                  <Input
                    aria-label="Member number"
                    value={order.customer.memberNumber}
                    onChange={(e) => update({ customer: { kind: "member", memberNumber: e.target.value } })}
                  />
                  <div className="flex flex-wrap gap-1">
                    {KNOWN_MEMBERS.map((member) => (
                      <Button
                        key={member.number}
                        size="xs"
                        variant={
                          order.customer.kind === "member" && order.customer.memberNumber === member.number
                            ? "secondary"
                            : "ghost"
                        }
                        onClick={() => update({ customer: { kind: "member", memberNumber: member.number } })}
                      >
                        {member.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              {order.customer.kind === "staff" ? (
                <Select
                  value={order.customer.staffId}
                  onValueChange={(staffId) => update({ customer: { kind: "staff", staffId } })}
                >
                  <SelectTrigger className="w-full" aria-label="Staff member">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.data?.map((member) => (
                      <SelectItem key={member.staffId} value={member.staffId}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </Step>

            <Step
              number={3}
              title="What they order"
              action={
                lines.length > 0 ? (
                  <Button size="xs" variant="ghost" onClick={() => update({ basket: {} })}>
                    Clear
                  </Button>
                ) : null
              }
            >
              {products.isPending ? (
                <LoadingBlock />
              ) : products.isError ? (
                <QueryError error={products.error} />
              ) : (
                <BasketPicker products={products.data} basket={order.basket} onChange={(basket) => update({ basket })} />
              )}
            </Step>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {lines.length > 0 ? (
            <AnswerBanner request={request} showDraft={draftDirty && compare.includes("draft")} />
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Show receipts for</span>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={compare}
              onValueChange={(value) => value.length > 0 && setCompare(value as RulebookName[])}
            >
              {(["legacy", "live", "draft"] as const).map((name) => (
                <ToggleGroupItem key={name} value={name} title={RULEBOOK_HINT[name]}>
                  {RULEBOOK_LABEL[name]}
                  {name === "draft" && draftDirty ? <Badge variant="warning">changed</Badge> : null}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Add something in step 3 to see what it costs.
            </p>
          ) : (
            <>
              <div className={`grid gap-4 ${compare.length > 1 ? "md:grid-cols-2" : ""} ${compare.length > 2 ? "xl:grid-cols-3" : ""}`}>
                {(["legacy", "live", "draft"] as const)
                  .filter((name) => compare.includes(name))
                  .map((name) => (
                    <RulebookReceipt key={name} rulebook={name} request={request} />
                  ))}
              </div>
              <ReceiptLegend />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  action,
  children,
}: {
  number: number;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {number}
        </span>
        <h2 className="flex-1 text-sm font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
