# Decisions

Architectural decisions that aren't obvious from the code. Add one only for a choice that constrains future work. Format: status, context, decision, consequences, alternatives, reconsider when.

| #                                                | Decision                                                               | Status   |
| ------------------------------------------------ | ---------------------------------------------------------------------- | -------- |
| [0001](0001-pure-pricing-engine.md)              | Pricing rules live in a pure package, not in NestJS                    | Accepted |
| [0002](0002-best-price-and-explicit-stacking.md) | Best single deal by default; stacking only by explicit pair            | Accepted |
| [0003](0003-three-rulebooks-draft-publish.md)    | Legacy / live / draft rulebooks with draft → impact → publish          | Accepted |
| [0004](0004-sqlite-prisma-owned-data-only.md)    | SQLite via Prisma for owned data only; Trestle data stays read-through | Accepted |
