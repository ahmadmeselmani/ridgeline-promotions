import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { TEMPLATE_DATABASE_PATH } from "../src/testing/test-database";

// Builds one migrated + seeded SQLite file per test run. Each test then works
// on its own copy (see useFreshDatabase), so tests never touch dev.db or each
// other.
export default function globalSetup(): void {
  rmSync(TEMPLATE_DATABASE_PATH, { force: true });
  const env = { ...process.env, DATABASE_URL: `file:${TEMPLATE_DATABASE_PATH}` };
  const cwd = `${__dirname}/..`;
  execSync("pnpm exec prisma migrate deploy", { cwd, env, stdio: "pipe" });
  execSync("pnpm exec prisma db seed", { cwd, env, stdio: "pipe" });
}
