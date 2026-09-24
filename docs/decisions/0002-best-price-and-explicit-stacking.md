# 0002: Best single deal by default; stacking only by explicit pair

**Status:** Accepted. Waiting on the customer about member stacking (see `docs/PRODUCT.md`, Unresolved).

**Context.** Trestle resolves clashes by the highest `priority` and has a single `stackable` flag. In the fixtures, the member discount is `stackable: true`. That produces results the customer says never happen: a double discount on a happy-hour beer, Ray's $16.20, and staff paying $57.40 for a $55 bundle.

**Decision.**

- The policy `best_price` (the cheapest single deal per item, with bundles considered first and used only when cheaper) is the default. `priority` stays selectable, so the legacy behaviour can be reproduced.
- Stacking is `stacksWith: [promotionId...]`: this deal may be added on top of those specific deals. `"*"` exists only to import legacy config faithfully.

**Consequences.**

- "Members keep 10% on food specials" is a config change, not code.
- Some customers pay more than today (member happy-hour beer: $9.18 → $10.20). The impact view makes that visible.
- Greedy bundle allocation isn't globally optimal when a basket has several bundles.

**Alternatives.** Keeping priority: it's what caused the problem. A global stack flag: it can't express "stack on food, not on beer".

**Reconsider when** the customer asks for order-level best price (whole basket) rather than per item.
