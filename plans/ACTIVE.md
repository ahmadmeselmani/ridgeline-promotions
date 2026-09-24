# Active work

Shared state between agents. Keep it short: durable facts only, no transcripts. Move finished substantial plans to `plans/completed/`.

## Objective

Get the prototype ready for the assessment session: a 10-minute non-technical demo, a 15-minute technical walkthrough, and a 15-minute live requirement change.

## Status

The prototype is feature-complete for the demo. `make check` passes. Persistence (SQLite) and the UX pass are done.

## Confirmed decisions

See `docs/decisions/0001`–`0004`. Product assumptions are listed in `docs/PRODUCT.md`.

## Tasks

- [x] Customer questions sent by email. Answers are pending; follow up later on "per item or whole order?" and "mid-shift changes / end minute" if needed.
- [ ] Apply the customer's answers: update `assumptions.ts`, `prisma/seed/data/rulebook.ts`, `docs/PRODUCT.md`, and the affected specs. If the pot is part of the deal, remove `PRM-26` (Schnitzel Tuesday — no pot).
- [x] Independent second pass completed on the engine and publish flow; review fixes applied for validation and per-deal restore behavior.
- [ ] Browser-check use cases 8–12 in `GUIDE.md` (verified through the API and tests only; use case 12 = deal status and per-deal Undo).
- [ ] `make check` is flaky: `promo-hub:check-types` runs `prisma generate` while `promo-hub:lint` reads the generated client, and Turbo caches the bad lint output. Make lint depend on generation in `turbo.json`, then add `--max-warnings 0` to promo-hub's `lint` script (every other package has it).
- [x] The app and README explicitly state that publishing updates prototype rules only; live tills remain unchanged until integration.
- [ ] Decide on formatting: run `pnpm format` once (72 files; formatting-only diff), then add `format:check` to `make check`.
- [ ] Browser-test the promotion editor sheet end to end (only covered through the API so far).
- [ ] Check whether Prisma 7's `migrate reset` seeds on its own. If it does, remove the extra `db:seed` from `make dbreset`. Needs the user to run it or consent: Prisma blocks agent-run resets.

## Blockers

- The customer's answers are pending, so everything under "Assumed" in `docs/PRODUCT.md` may change.

## Affected areas for likely live changes

The mapping from change to location is in the `README.md` table ("Likely live changes"). Most are rulebook config; guards and caps go in `packages/pricing-engine/src/engine.ts`.

## Verification

`make check`, plus `pnpm format:check` (known failing; see Tasks).
