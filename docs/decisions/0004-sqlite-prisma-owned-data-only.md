# 0004: SQLite via Prisma, for data this service owns

**Status:** Accepted

**Context.** Rulebooks and overrides were in memory and lost on restart. The reference codebase uses Prisma 7 with a driver adapter (Postgres). The Trestle API has no live sandbox; its data is fixtures.

**Decision.**

- Prisma 7.9.1 (pinned to match the reference) with `@prisma/adapter-better-sqlite3` persists only what this service owns: `Rulebook` (live, draft), `Promotion`, `PriceOverride`.
- Promotion sub-structures are JSON columns, validated by the contract schemas on read.
- Trestle data (venues, products, members, staff, promotions) stays behind `TrestleService` and is never copied.

**Consequences.**

- Zero-setup local database.
- Switching to Postgres means changing the provider, the adapter and the URL.
- JSON columns can't be queried relationally; that's fine at this size.
- Jest needs `--experimental-vm-modules` for the generated client.

**Alternatives.** Keeping everything in memory: data resets on restart. Postgres in Docker: more setup for reviewers than a prototype warrants. Normalised tables for slots and overrides: more schema with no current benefit.

**Reconsider when** deploying for real (Postgres), querying inside promotion structures, or adding multi-tenant data.
