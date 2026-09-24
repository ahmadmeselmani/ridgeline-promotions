# Product

Sources: the customer brief and assessment rules in the parent folder (`../01_YOUR_BRIEF.md`, `../02_HOW_THIS_WORKS.md`, `../03_TRESTLE_API.md`, `../04_fixtures.json`), and the implementation. Anything not backed by those is listed under **Assumed** or **Unresolved**.

## Problem

Ridgeline Hotels runs 9 venues (mostly pubs, 2 bistros; the fixtures contain 6) on the Trestle POS, with 5 overlapping promotions. Nobody can predict which deal the till applies, so staff type in manual prices and promotion reporting becomes unreliable. Every change to a deal needs a support ticket.
The root cause, found in the fixtures: Trestle resolves clashes by `priority`, and the member discount is `stackable: true`. That contradicts the customer's stated rule, "only ever the best single deal".

## Actors

| Actor                                                  | In the product                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| Tania Broughton, Group Marketing & Ops Manager         | Edits deals, previews who is affected, publishes                    |
| Bar and bistro staff                                   | Need an explained price (the receipt view)                          |
| Supervisors and managers (`override_price` permission) | The only people who may enter a manual price, and it needs a reason |
| Customers: walk-in, member, staff                      | Get deals according to audience                                     |
| Interview panel (one non-technical member)             | Audience for the demo; the Start here page is the walkthrough       |

## Workflows (one UI page each)

| Page             | Route        | Does                                                                                        |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------- |
| Start here       | `/`          | Problem statement, 4-step walkthrough, today's till vs new rules for the brief's situations |
| Price an order   | `/simulator` | Quote any basket at any venue and time; one receipt per rulebook, with reasons              |
| Manage deals     | `/rulebook`  | Edit your draft → see affected situations → publish or undo. Each deal shows its status against the tills (published, changed, new, turned off, removed) and can be undone on its own |
| Week at a glance | `/clashes`   | 7-day × 30-minute grid per venue: overlaps and double discounts                             |
| Manual prices    | `/overrides` | Record a manual price (permission + reason), reported apart from promotions                 |

## Glossary (use these names; don't invent synonyms)

| Term (code)                                                | UI wording                          | Meaning                                                                                           |
| ---------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| Promotion                                                  | deal                                | One offer: `percent_off`, `fixed_price` or `bundle_price`                                         |
| Rulebook `legacy`                                          | Today's till                        | Trestle's config, imported unchanged. Read-only, never stored                                     |
| Rulebook `live`                                            | New rules                           | What tills would price with. Changes only by publishing                                           |
| Rulebook `draft`                                           | Your draft                          | The only editable rulebook                                                                        |
| Resolution policy `best_price` / `priority`                | "When deals clash"                  | Cheapest single deal wins / Trestle's highest priority wins                                       |
| `stacksWith`                                               | "Can be added on top of"            | Explicit list of deals this one stacks on. `"*"` (any) exists only to reproduce the legacy config |
| Bundle slot                                                | part of a bundle                    | "N× any of these products", e.g. 1× any pot                                                       |
| Venue override                                             | venue exception                     | Per-venue enable flag or different hours for one promotion                                        |
| Audience `everyone` / `member` / `staff`; customer `guest` | Walk-in / Member / Staff            | Who a deal is for. A customer is exactly one kind                                                 |
| Trading day                                                | —                                   | The business day. Anything before 05:00 belongs to the previous day                               |
| Scenario                                                   | situation (from the brief)          | A named basket, venue and time. Used as simulator presets and the regression set                  |
| Impact                                                     | Who's affected                      | Scenarios whose price or applied deals differ between two rulebooks                               |
| Clash `competes` / `stacks`                                | overlap / two discounts on one item | Two live deals cover the same item for the same customer                                          |
| Price override                                             | manual price                        | A staff-entered price with a reason. Not a promotion                                              |

## Non-goals (deliberately cut)

Payments, settlements, voids, webhooks, real till integration, authentication, approval workflow, publish history or rollback, per-venue price lists, optimal allocation when a basket has several bundles.

## Assumed until the customer confirms

These are flagged in the data and on the Start here page. They're defined in `apps/promo-hub/src/trestle/assumptions.ts` and `apps/promo-hub/prisma/seed/data/rulebook.ts`.

1. The bistros are The Gilded Spoon (`VEN-0907`) and Fitzroy Larder (`VEN-1207`).
2. Schnitzel Tuesday includes a pot. Pot products `PRD-0109` and `PRD-0110` are invented. A schnitzel without a pot keeps today's $18 through *Schnitzel Tuesday — no pot* (`PRM-26`) until Tania answers.
3. Parma & Pint accepts lager only.
4. The member discount does **not** stack. Ray's order goes from $16.20 to $18.00, and a member's happy-hour beer goes _up_ from $9.18 to $10.20.
5. Timezone is derived from the venue's state. Trestle returns `null`.
6. Member and staff audiences are inferred from promotion names. Trestle has no audience field.

## Unresolved (needs the customer)

- Is the best deal chosen per item or across the whole order?
- Should members keep their 10% on some deals (Ray)?
- Which pot is included, and can a customer upgrade to a pint?
- Which bistro wants the 5–7pm happy hour, and who may change deals: only Tania, or venue managers too?
- Melbourne Cup: which venues, and should it replace Schnitzel Tuesday that day?
- Does a deal change affect orders already open? Is the end minute of a window inclusive?
