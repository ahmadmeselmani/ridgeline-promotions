# 0001: Pricing rules live in a pure package

**Status:** Accepted (prototype build, Sep 2026)

**Context.** The customer's core complaint is that nobody can predict or explain the till's price. The rules must be testable in isolation, runnable anywhere a till might call them, and impossible to fork between the API and the UI.

**Decision.** All pricing lives in `packages/pricing-engine`: eligibility, schedules and time, bundles, resolution, stacking, explanations and the clash grid. It has no I/O and depends only on `contracts`. `promo-hub` feeds it data; `promo-web` never imports it and only renders what the API returns.

**Consequences.**

- Most tests are fast pure-function tests.
- A real till integration could embed the same package.
- The web app re-implements a few display formatters (see the known duplication in `ENGINEERING.md`).

**Alternatives.** Logic inside a Nest service: harder to test, and tied to HTTP. Shared with the web app for client-side pricing: rejected, because the price must come from one place.

**Reconsider when** pricing needs data the engine can't receive as input (e.g. live stock), or a till must run offline and embed the engine.
