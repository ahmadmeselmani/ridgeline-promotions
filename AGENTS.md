# AGENTS.md

Entrypoint for coding agents (Codex, Claude Code, others). Claude Code loads this through `CLAUDE.md`.

## What this is

A prototype for Ridgeline Hotels (a pub group on the Trestle POS). It makes overlapping promotions predictable: it prices any order with a reason for every deal, lets the customer edit deals in a draft, preview who is affected, and publish. It was built for a time-boxed technical assessment.
pnpm + Turborepo monorepo: NestJS API (`apps/promo-hub`), Next.js + shadcn UI (`apps/promo-web`), and a pure pricing engine (`packages/pricing-engine`).

## Where knowledge lives (load only what the task needs)

| Task touches                                                   | Read                    |
| -------------------------------------------------------------- | ----------------------- |
| Product behaviour, terminology, what's assumed                 | `docs/PRODUCT.md`       |
| Package boundaries, data ownership, API, security posture      | `docs/ARCHITECTURE.md`  |
| Writing code: NestJS, Prisma, Next.js, contracts, engine rules | `docs/ENGINEERING.md`   |
| UI, components, tokens, wording                                | `docs/DESIGN-SYSTEM.md` |
| Tests and which checks a change needs                          | `docs/TESTING.md`       |
| Why a structural decision was made                             | `docs/decisions/`       |
| What is in progress or blocked                                 | `plans/ACTIVE.md`       |
| Running the project, interview-facing summary                  | `README.md`             |

Don't read every doc up front. A UI task doesn't need the database rules, and a Prisma task doesn't need the design system.

## How to work

1. **Search first.** Find the symbol or route with `rg`, open the smallest relevant file, and widen only when the evidence says to.
2. **Reuse.** Every NestJS module follows the same controller → service → client shape; copy the nearest sibling module. Shared UI lives in `packages/ui`. Shared types and validation live in `packages/contracts`.
3. **Change.** Keep changes inside the owning package (see the boundaries below).
4. **Verify.** Run `make check`. Never report a check as passing unless you ran it.
5. **Record.** If the work spans sessions or agents, update `plans/ACTIVE.md` with durable state only.

Skip the repository-wide investigation that produced these docs unless you're asked for an audit.

## Hard constraints

- **Pricing rules live only in `packages/pricing-engine`.** It is pure: no I/O, no Nest, no Prisma. Controllers, services and React components never decide prices.
- **Request and response shapes are Zod schemas in `packages/contracts`.** Change the contract first; the API and web get their types from it.
- **In `promo-hub`, only `*.client.ts` files touch Prisma or the Trestle stub.** Services map data to contracts, and controllers stay thin.
- **Legacy (Trestle's own config) is derived on every read and never stored.** Live and draft are stored in SQLite. Only the draft is edited; live changes only through publish.
- **UI wording:** say "Today's till / New rules / Your draft", never legacy/live/draft (`RULEBOOK_LABEL` in `apps/promo-web/lib/format.ts`).
- **Assumptions stay flagged.** Data invented because Trestle lacks it lives in `apps/promo-hub/src/trestle/assumptions.ts` and carries `source: "assumed" | "derived"`.
- **Prisma is pinned to 7.9.1** through the pnpm catalog, to match the reference repo. Don't bump it casually.
- **There is no auth.** Don't expose the API beyond localhost, and don't add security-looking code that isn't real (see `docs/ARCHITECTURE.md#security`).
- **Out of scope:** payments, settlements, voids, webhooks, real till integration. The fixtures contain them; ignore them.

## Commands

```bash
make            # list targets
make setup      # first run: install, create .env files, migrate + seed SQLite
make dev        # API :3004 (Swagger /docs), web :3003
make check      # build + type-check + lint + unit tests + e2e: the verification gate
make gen        # regenerate the Prisma client after editing schema.prisma
make migdev ARGS="--name <change>"   # new migration
```

Node 24 (`.nvmrc`), pnpm 11. Never edit generated output (`dist/`, `.next/`, `src/database/generated/`).

## Review before handing off

For anything beyond a trivial change, re-read your diff as a reviewer:

- Is the rule in the right package?
- Were the contract and the tests updated together?
- Did you add an abstraction with no second use?
- Is the UI wording consistent?
- Does the Prisma change have a migration?

Get a second pass (another agent or a human) for changes to the pricing engine, the rulebook or publish flow, or the Prisma schema.
