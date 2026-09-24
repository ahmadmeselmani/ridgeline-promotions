# Active work

Shared state between agents. Keep it short: durable facts only, no transcripts. Move finished substantial plans to `plans/completed/`.

## Objective

Get the prototype ready for the assessment session: a 10-minute non-technical demo, a 15-minute technical walkthrough, and a 15-minute live requirement change.

## Status

The prototype is feature-complete for the demo. `make check` passes. Persistence (SQLite) and the UX pass are done.

## Confirmed decisions

See `docs/decisions/0001`–`0004`. Product assumptions are listed in `docs/PRODUCT.md`.

## Tasks

- [ ] Send the customer questions (draft in `../email_reply.md`, outside the repo); add "per item or whole order?" and "mid-shift changes / end minute".
- [ ] Apply the customer's answers: update `assumptions.ts`, `proposed-rulebook.ts`, `docs/PRODUCT.md`, and the affected specs.
- [ ] README: state that the prototype is advisory. Tills keep Trestle's priority behaviour until the engine runs in the checkout path.
- [ ] Decide on formatting: run `pnpm format` once (72 files; formatting-only diff), then add `format:check` to `make check`.
- [ ] Browser-test the promotion editor sheet end to end (only covered through the API so far).
- [ ] `apps/promo-web/lib/api-client.ts` doesn't read the Zod validation error shape (`{ errors, properties }`), so a 400 from the editor shows as "Bad Request" instead of the field errors.
- [ ] Check whether Prisma 7's `migrate reset` seeds on its own. If it does, remove the extra `db:seed` from `make dbreset`. Needs the user to run it or consent: Prisma blocks agent-run resets.

## Blockers

- The customer's answers are pending, so everything under "Assumed" in `docs/PRODUCT.md` may change.

## Affected areas for likely live changes

The mapping from change to location is in the `README.md` table ("Likely live changes"). Most are rulebook config; guards and caps go in `packages/pricing-engine/src/engine.ts`.

## Verification

`make check`, plus `pnpm format:check` (known failing; see Tasks).
