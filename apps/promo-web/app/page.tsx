"use client";

import Link from "next/link";
import { ArrowRight, Calculator, CalendarRange, ClipboardList, HandCoins } from "lucide-react";
import { Button } from "@ridgeline/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ridgeline/ui/card";
import { ImpactList } from "../components/impact-list";
import { PageHeader } from "../components/page-header";
import { LoadingBlock, QueryError } from "../components/query-state";
import { useImpact } from "../lib/queries/pricing";
import { APP_PATHS } from "../paths/app";

const PROBLEMS = [
  {
    title: "Nobody can predict the till",
    body: "Five deals overlap and the till never says which one it picked. Staff type in their own prices to be safe.",
  },
  {
    title: "The rules on the till aren't the rules you think",
    body: "You said 'only ever the best single deal'. Trestle is set up so the member 10% stacks on everything. That's why Ray gets $16.20, and members get two discounts on a happy-hour beer.",
  },
  {
    title: "Every change is a 3-day ticket",
    body: "Different hours for the bistros, a one-day Melbourne Cup deal — the system can't express them, so they don't happen.",
  },
] as const;

const STEPS = [
  {
    href: APP_PATHS.SIMULATOR,
    icon: Calculator,
    title: "Price an order",
    body: "Ring up Ray's Tuesday schnitzel, or any order. See today's price, the new price, and why.",
    cta: "Try Ray's order",
  },
  {
    href: APP_PATHS.RULEBOOK,
    icon: ClipboardList,
    title: "Change a deal",
    body: "Give the bistro a 5–7 happy hour. Check whose price changes before anything goes live, then publish.",
    cta: "Manage deals",
  },
  {
    href: APP_PATHS.CLASHES,
    icon: CalendarRange,
    title: "Check the week",
    body: "One venue, one week. Red squares mean somebody gets two discounts on the same item.",
    cta: "See the week",
  },
  {
    href: APP_PATHS.OVERRIDES,
    icon: HandCoins,
    title: "Handle exceptions",
    body: "Manual prices are still possible, but only supervisors can enter them, and each needs a reason.",
    cta: "Manual prices",
  },
] as const;

const ASSUMPTIONS = [
  "Venue timezones come from the state (Trestle has none): SA → Adelaide, VIC → Melbourne. Daylight saving handled.",
  "The Gilded Spoon and Fitzroy Larder are the two bistros — Trestle doesn't say.",
  "A 'pot' is on the menu at $8.00 / $8.50 — Trestle's catalogue has no pot.",
  "Trestle promotions don't say who they're for; 'Member' and 'Staff' deals were identified by name.",
  "Sales after midnight belong to the night before (trading day starts at 5am).",
] as const;

export default function OverviewPage() {
  const impact = useImpact("legacy", "live");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Promotions that don't fight each other"
        description="One clear rule: every customer gets their single best deal. The till explains every price, and you can change deals yourself."
        actions={
          <Button asChild>
            <Link href={APP_PATHS.SIMULATOR}>
              Price an order <ArrowRight />
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {PROBLEMS.map((problem) => (
          <Card key={problem.title}>
            <CardHeader>
              <CardTitle>{problem.title}</CardTitle>
              <CardDescription>{problem.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Try it in four steps</h2>
          <p className="text-sm text-muted-foreground">Each step is one page in the menu above.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.href}>
              <Link href={step.href} className="group block h-full">
                <Card className="h-full transition-colors group-hover:ring-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </span>
                      <step.icon className="size-4 text-primary" />
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.body}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <span className="flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                      {step.cta} <ArrowRight className="size-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">What changes for customers</h2>
          <p className="text-sm text-muted-foreground">
            Situations from the brief, priced by today&apos;s till and by the new rules. Green means the customer pays less,
            red means more. Click a row to see both receipts.
          </p>
        </div>
        {impact.isPending ? (
          <LoadingBlock />
        ) : impact.isError ? (
          <QueryError error={impact.error} />
        ) : (
          <ImpactList impact={impact.data} emptyText="No differences." />
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Assumed until Tania confirms</CardTitle>
          <CardDescription>Things Trestle didn&apos;t tell us. Each is flagged in the data, not hidden.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {ASSUMPTIONS.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
