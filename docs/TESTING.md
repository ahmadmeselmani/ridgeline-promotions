# Testing

## Gate

`make check` runs `turbo run build check-types lint test`, then the promo-hub e2e suite. It must pass before any hand-off. Report failures honestly; never loosen lint, TypeScript or tests to get green.

## Suites

| Suite           | Where                                   | Framework                       | Run                                                                                   |
| --------------- | --------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| Engine unit     | `packages/pricing-engine/src/*.spec.ts` | Jest + ts-jest                  | `pnpm --filter @ridgeline/pricing-engine test`                                        |
| API integration | `apps/promo-hub/src/**/*.spec.ts`       | Jest, real `AppModule` + SQLite | `pnpm --filter promo-hub test`                                                        |
| API e2e (HTTP)  | `apps/promo-hub/test/*.e2e-spec.ts`     | Jest + supertest                | `make e2e`                                                                            |
| Web             | none                                    | —                               | Covered by `next build`, type-check and lint. Check visual changes by running the app |

## How the tests are built

- **Engine:** build promotions with `promo()` and use the catalogue in `src/testing/builders.ts`. It includes both `LEGACY_PROMOTIONS` and `PROPOSED_PROMOTIONS`. Assert totals and reason strings; reasons are user-facing output.
- **API:** no mocks. Each test calls `useFreshDatabase()` (`src/testing/test-database.ts`) before compiling `AppModule`, which copies a migrated and seeded template database into the OS temp directory.
  - `test/global-setup.ts` builds the template (migrate deploy + seed).
  - `test/global-teardown.ts` deletes the copies.
  - Tests never touch `prisma/dev.db`.
- **Close the app** in `afterEach` (`await app.close()`), or database handles leak.
- **Jest quirks:**
  - The test scripts set `NODE_OPTIONS=--experimental-vm-modules`, because Prisma 7's generated client uses dynamic `import()`. The syntax is POSIX-only.
  - `moduleNameMapper` strips `.js` from relative imports of the generated client.

## What a change needs

| Change                           | Minimum                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Pricing rule or explanation text | New or updated engine spec, plus `make check`                                     |
| Contract shape                   | `make check` (the build catches consumers); update the affected specs             |
| Hub service or controller        | A spec in the module, or an e2e case if HTTP behaviour changes                    |
| Prisma schema                    | Migration + `make check` (the template database uses the migrations)              |
| UI only                          | `pnpm turbo run check-types lint build --filter=promo-web`, then look at the page |
| Docs only                        | Nothing                                                                           |

## Not checked (known)

- **Formatting:** `pnpm format:check` exists but currently fails (72 files never formatted; see `plans/ACTIVE.md`). It is not in the gate.
- No web component tests, no browser e2e, no CI.
