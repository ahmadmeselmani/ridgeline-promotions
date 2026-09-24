import { copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const TEMPLATE_DATABASE_PATH = join(tmpdir(), "promo-hub-test-template.db");

// Points PrismaService at a private copy of the seeded template. Call before
// compiling the Nest testing module.
export function useFreshDatabase(): string {
  const path = join(
    tmpdir(),
    `promo-hub-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.db`,
  );
  copyFileSync(TEMPLATE_DATABASE_PATH, path);
  process.env.DATABASE_URL = `file:${path}`;
  return path;
}
