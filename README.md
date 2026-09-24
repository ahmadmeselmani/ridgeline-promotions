# Ridgeline Promotions: prototype

Ridgeline's tills can't be predicted because five promotions overlap. On top of that, the rules configured in Trestle aren't the rules Tania thinks they are. This prototype makes the rules **visible**, **explainable** and **editable by Tania**, and keeps everything else out of scope.

> The customer said "they only ever get the best single deal". Trestle's config says the member discount is `stackable: true` and conflicts are decided by `priority`. That one mismatch explains Ray's $16.20, the double discount on happy-hour beers, and staff paying more for Parma & Pint than walk-ins do.

## Run it

Node 24 and pnpm 11. The `Makefile` wraps the root scripts (run `make` to list the targets).

Before anything else, switch to the Node version pinned in `.nvmrc` (24.18.0). Run `nvm install` first if you don't have it yet:

```bash
nvm use        # always first, in every new terminal
make setup     # install, create .env files from the examples, migrate + seed SQLite
make dev       # API on :3004 (Swagger at /docs), web on :3003
make check     # build, type-check, lint, unit + e2e tests: everything CI would run
make dbreset   # wipe the demo database and re-seed it (handy right before the interview)
make studio    # browse the SQLite data in Prisma Studio
```

Each API test runs on its own throwaway SQLite copy, so tests never touch `dev.db`.

**New here?** Read [`GUIDE.md`](GUIDE.md): install, step-by-step use cases, and how to present the system.

**Working on the code (humans or AI agents):** start at [`AGENTS.md`](AGENTS.md). Detailed docs are in [`docs/`](docs/), decision records in [`docs/decisions/`](docs/decisions/), and in-flight work in [`plans/ACTIVE.md`](plans/ACTIVE.md).

## Where data lives

| Data | Stored in | Why |
|---|---|---|
| Live and draft rulebooks (with their promotions) | **SQLite via Prisma 7.9.1** (`apps/promo-hub/prisma/schema.prisma`) | This service owns them. Publishing replaces live in one transaction |
| Manual price overrides | **SQLite** (`PriceOverride`) | Owned here until Trestle's sale line can carry an override reason |
| Venues, products, members, staff, Trestle's promotion config | Trestle, stubbed from `trestle/fixtures/trestle-fixtures.json` | Trestle's data. It's read, never copied. The *legacy* rulebook is derived from it on every read, so it can't drift |
| Seed data: the starting live and draft rulebooks | `apps/promo-hub/prisma/seed/`: `data/` holds the values, `seeders/` writes them, `index.ts` runs them | One place for everything `make setup` / `make dbreset` puts in the database. Seeding never overwrites an existing rulebook |
| Assumed data (pots, bistros, timezones), scenarios | Code (`trestle/assumptions.ts`, `scenarios/scenarios.data.ts`) | Static and reviewable in a diff. Not stored in the database, so not seed data |

Prisma follows the qbase reference: `prisma-client` generator with CJS output, a driver adapter (`@prisma/adapter-better-sqlite3` here, `@prisma/adapter-pg` there) wired in one file (`src/database/prisma-adapter.ts`), and a global `DatabaseModule`/`PrismaService`. Only the `*.client.ts` files touch Prisma. Moving to Postgres means changing the schema `provider`, the adapter and `DATABASE_URL`. JSON columns (schedule, bundle slots, venue exceptions) are re-validated with the shared Zod schema on every read.

## What's in the box

```
apps/
  promo-hub/        NestJS API: modules follow controller → service → client
  promo-web/        Next.js + shadcn UI for Tania and the duty managers
packages/
  pricing-engine/   Pure TS: which deal applies, and why. No I/O. Most of the tests live here.
  contracts/        Zod schemas shared by API and web (request/response types)
  nest-common/      Zod validation pipe, response envelope, Swagger helpers
  ui/               shadcn components + theme
  eslint-config/, typescript-config/
```

| Page | What it answers |
|---|---|
| **Start here** | What's wrong today, a four-step walkthrough, and which customers' prices change (today's till vs the new rules) |
| **Price an order** | "What will the till charge for *this* order, and why?" A one-sentence answer, then one receipt per set of rules |
| **Manage deals** | Tania edits deals in her **draft** (change → check who's affected → publish). No ticket. Each deal shows whether the tills already run it (Published / Changed / New / Turned off / Removed), with Undo per deal |
| **Week at a glance** | One venue, one week: where deals overlap, and how many hours someone can get two discounts at once |
| **Manual prices** | Overrides need `override_price` and a reason, and are reported separately from promotions |

The UI uses one vocabulary throughout: **Today's till** (Trestle's current setup), **New rules** (published) and **Your draft** (unpublished changes). A banner on every page flags unpublished changes.

### Three rulebooks
- **legacy**: Trestle's config imported *unchanged* (priority wins, member stacks on everything, `23:59` gap kept). This proves we can reproduce today's till: Ray = $16.20.
- **live**: what the tills use once published.
- **draft**: work in progress. Publishing copies it to live, and discarding resets it.

## Decisions

The reasoning behind the structural ones is in [`docs/decisions/`](docs/decisions/).

| Decision | Why |
|---|---|
| **Best single deal for the customer** is the default policy. Legacy "priority" is still selectable | It's what Tania said. Priority produced staff paying $57.40 vs $55 for walk-ins |
| **Stacking is opt-in per pair** (`stacksWith: ["PRM-23"]`), not a single boolean | Lets Tania say "members keep 10% on food specials" without also giving 10% on happy-hour beer |
| **Every price comes with reasons**: applied, stacked, and skipped ("Happy Hour is cheaper ($10.20 vs $10.80)") | Staff override because they don't trust the till. An explained price is a trusted price |
| **Draft → impact → publish** | Tania changes things herself, but sees the consequence first, including prices that go *up* |
| **Deal status is worked out, not stored**: each draft deal is compared with live on every read | A stored `isPublished` flag can't say "published, but edited since", and it can drift. Turning a live deal off goes through the draft and the preview like any other change |
| **Venue exceptions** on a promotion (bistro happy hour 5–7) instead of copying the promotion per venue | One deal, one report line. The exception is visible in the rulebook |
| **Date ranges** (`validFrom`/`validTo`) on top of weekdays | Melbourne Cup (Tue 3 Nov), summer program |
| **Bundles are matched first and only used if cheaper**, and the bundle price is split across lines in proportion to menu price | Lines still add up exactly for reporting |
| **"Cheaper" means the final price**, including any deal a rule allows on top. A bundle or set price at or above the menu price is never charged, under either policy | The customer always gets the lowest price the rules allow |
| **Trading day starts at 5am**: 12:30am counts as the previous night | Venues trade to 1am. Matches Trestle's `business_date` |
| **Timezone from IANA zone**, derived from state | Handles SA vs VIC and daylight saving from 4 Oct 2026 |
| Unknown or lapsed member → priced as guest, with a note | Never block a sale over a lookup |
| One rounding rule: per unit, to the cent | Predictable |

## Assumptions (asked Tania; flagged in the UI until she answers)
1. Bistros are **The Gilded Spoon** and **Fitzroy Larder** (Trestle has no venue type).
2. Schnitzel Tuesday = schnitzel + **a pot**. Pot products (`PRD-0109/0110`, $8.00/$8.50) are **assumed**; the catalogue has none. A schnitzel ordered without a pot stays at today's $18 through a separate *Schnitzel Tuesday — no pot* deal, so nobody pays more until Tania answers.
3. Parma & Pint stays **lager only**, as configured today.
4. Member discount **does not stack** (Tania's stated rule). Ray's $16.20 becomes $18.00, and a member's happy-hour beer goes *up* from $9.18 to $10.20. The impact view shows this so it's a conscious decision, not a surprise.
5. Trestle promotions have no "who is it for" field, so member and staff deals were identified by name.

## Trestle API gaps to raise (would be needed for production)
- `timezone` is `null` for every venue.
- Promotions have **no audience** (member/staff), **no venue scope**, **no date range**, and `stackable` is undocumented.
- Orders have **no member/staff reference**, so the till can't know the customer is Ray.
- Sales lines have `discount_cents` but **no `promotion_id` and no override reason**. This is the root cause of "promotion reporting is fiction". The prototype records overrides separately, and a real build needs both fields on the sale line.

## Deliberately cut
- Payments, settlements, voids, webhooks: in the fixtures, but not this problem.
- Auth, approval workflow, and publish history/rollback (SQLite keeps current state only, with no version history yet).
- Real till integration. The engine is the part a till would call (`POST /pricing/quote` accepts a till's `at` timestamp).
- Optimal multi-bundle allocation (greedy is fine for one bundle per basket).
- Per-venue price lists (the sandbox has one).

## Likely live changes, and where each one goes
| Change | Where |
|---|---|
| "Ray keeps his 10% on food specials" | Rulebook → Member Discount → tick *Schnitzel Tuesday* and *Schnitzel Tuesday — no pot* under "Can be added on top of" (config, no code) |
| "The pot is part of the deal" | Switch off *Schnitzel Tuesday — no pot* (config) |
| "Bistro happy hour 5–7" | Rulebook → Happy Hour → Venue exception (config) |
| "Melbourne Cup, VIC only, 3 Nov" | New promotion: venues = VIC, first/last day = 3 Nov (config) |
| "Parma & Pint with any pint" | Edit the bundle's pint slot to tick Pale Ale (config) |
| "Never discount below X" / "cap at 30%" | One guard at the end of `priceBasket` in `packages/pricing-engine/src/engine.ts`, plus a test |
| "Staff don't get happy hour" | Already true: best single deal. Otherwise a new exclusion rule in the engine |
