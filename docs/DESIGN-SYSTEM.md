# Design system

The audience is someone who runs pubs, not someone who writes code. Plain words first, then numbers, with the answer before the detail.

## Foundations

- **Tokens:** `packages/ui/src/styles/globals.css`. oklch CSS variables on `:root` and `.dark`, exposed to Tailwind 4 through `@theme inline`.
  - Palette: warm paper background, dark ink, brass-green `primary`.
  - Semantic colours: `success`, `warning`, `info`, `destructive`.
  - Never hard-code colours; use token classes (`bg-primary`, `text-muted-foreground`, `bg-success/15`).
- **Typography:** Inter (`--font-inter`, loaded in `app/layout.tsx`). Page title is `text-2xl font-semibold`; section title is `text-lg font-semibold`. Money always uses `tabular-nums`.
- **Radius:** `--radius: 0.625rem` with scaled `rounded-*`.
- **Elevation:** cards use a ring rather than a shadow. Only the sticky publish bar uses `shadow-lg`.
- **Icons:** `lucide-react` only, at `size-4` by default.
- **Dark mode:** `next-themes` (`class` attribute), toggled in the header. Every token has a `.dark` value.
- **Layout:** `max-w-7xl` centred, `px-4`. Two-column page layouts collapse to one column below `lg`.

## Components

- **Generic primitives** live in `packages/ui/src/` (shadcn, style `radix-nova`, Radix primitives): alert, badge, button, card, checkbox, dialog, input, label, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip.
  - Import them as `@ridgeline/ui/<name>`.
  - Add new ones with the shadcn CLI, configured by `packages/ui/components.json`. Don't hand-roll a primitive that shadcn provides.
  - ReUI (used in the reference repo) is **not** used here.
- **Feature components** live in `apps/promo-web/components/<feature>/` (`simulator`, `rulebook`, `clashes`). Shared app-level pieces sit at the root of `components/`: `app-shell`, `page-header`, `receipt`, `impact-list`, `query-state`.
  - Never move feature components into `packages/ui`.

## Wording (defined once in shared constants; reuse them)

| Concept   | Say                                                                       | Constant                                             |
| --------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| Rulebooks | Today's till / New rules / Your draft                                     | `RULEBOOK_LABEL`, `RULEBOOK_HINT` in `lib/format.ts` |
| Pages     | Start here, Price an order, Manage deals, Week at a glance, Manual prices | `NAV` in `components/app-shell.tsx`                  |
| Audience  | Everyone / Members / Staff; the customer toggle says Walk-in              | `AUDIENCE_LABEL`                                     |
| Promotion | "deal" in UI copy                                                         | —                                                    |

Avoid jargon in UI text: no "legacy", "stackable", "priority number" or "rulebook". Explain in a sentence ("a second discount on the same item").

## Patterns

- **Page:** `PageHeader` with `title`, a one-line `description` and an optional `tip` (a one-sentence how-to in a lightbulb callout).
- **Answer first:** summarise the result in one sentence before the detail. Examples: `AnswerBanner` in the simulator, the "N hours of double discount" banner on the week page.
- **Receipt** (`components/receipt.tsx`) is the one way to show a priced order.
  - Green `success` badge: the deal given.
  - `Package` icon: bundle.
  - Amber `warning` badge with a `Layers` icon: a stacked second discount.
  - The "Not applied" box lists skipped deals with reasons.
  - `ReceiptLegend` explains the colours.
- **Colour meaning** (keep it consistent):
  - `success`: customer pays less, or a deal was applied.
  - `destructive`: pays more, or a double discount.
  - `warning`: unpublished changes, or stacking.
  - `info`: an overlap that is resolved fine.
- **Multi-step flows** show numbered steps (simulator form steps 1–3; `PublishSteps` on Manage deals).
- **Unpublished changes:** a dot on the nav item, a banner on every other page, and the sticky publish bar on Manage deals.
- **Forms:** `Label` + `Input` / `Select` / `ToggleGroup` (the `outline` variant shows the selected option in primary). Editing happens in a `Sheet` (`PromotionEditor`). Reference fields are checkbox lists.
- **Tables:** `@ridgeline/ui/table` inside a `Card` with `className="py-0"`.

## States

- **Loading:** `LoadingBlock` (skeleton). Keep old data visible while refetching (`placeholderData: keepPreviousData`, dimmed with `opacity-60`).
- **Error:** `QueryError` (destructive alert, which hints that the API may be down).
- **Empty:** dashed-border box with one instruction sentence ("Add something in step 3…").
- **Mutation feedback:** `sonner` toasts. Success says what changed ("Published. Tills now use these rules."); errors show the API message.

## Accessibility and motion

- Icon-only buttons need an `aria-label`. The nav uses `aria-current="page"`. Grid cells have descriptive `aria-label`s. Radix provides keyboard support for select, sheet, tabs and toggle.
- Motion is limited to the shadcn/`tw-animate-css` enter and exit animations and skeleton pulse. There's no Lottie, Rive or sound, and none is planned. No explicit `prefers-reduced-motion` handling exists yet; add `motion-reduce:` variants if you introduce new animation.
