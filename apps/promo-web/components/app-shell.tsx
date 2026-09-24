"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Beer,
  CalendarRange,
  ClipboardList,
  HandCoins,
  Home,
  Moon,
  ReceiptText,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@ridgeline/ui/button";
import { cn } from "@ridgeline/ui/lib/utils";
import { useRulebooks } from "../lib/queries/rulebooks";
import { APP_PATHS } from "../paths/app";

// Named for what the page lets you do, not what it's built from.
export const NAV = [
  { href: APP_PATHS.OVERVIEW, label: "Start here", icon: Home },
  { href: APP_PATHS.SIMULATOR, label: "Price an order", icon: ReceiptText },
  { href: APP_PATHS.RULEBOOK, label: "Manage deals", icon: ClipboardList },
  { href: APP_PATHS.CLASHES, label: "Week at a glance", icon: CalendarRange },
  { href: APP_PATHS.OVERRIDES, label: "Manual prices", icon: HandCoins },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: rulebooks } = useRulebooks();
  const draftDirty = rulebooks?.find((r) => r.name === "draft")?.hasUnpublishedChanges ?? false;
  const onDealsPage = pathname.startsWith(APP_PATHS.RULEBOOK);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href={APP_PATHS.OVERVIEW} className="flex shrink-0 items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Beer className="size-4" />
            </span>
            <span className="hidden lg:inline">Ridgeline Promotions</span>
          </Link>
          <nav aria-label="Main" className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active =
                item.href === APP_PATHS.OVERVIEW ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted font-medium text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                  {item.href === APP_PATHS.RULEBOOK && draftDirty ? (
                    <span className="size-2 rounded-full bg-warning" aria-label="unpublished changes" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle dark mode"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
        </div>
        <div className="border-t bg-primary/8">
          <div className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs text-muted-foreground">
            Prototype only — not connected to live tills. Publishing updates the prototype&apos;s New rules.
          </div>
        </div>
        {draftDirty && !onDealsPage ? (
          <div className="border-t bg-warning/15">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-sm">
              <span>You have changes that aren&apos;t in New rules yet.</span>
              <Link href={APP_PATHS.RULEBOOK} className="flex items-center gap-1 font-medium underline-offset-4 hover:underline">
                Review and publish <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
