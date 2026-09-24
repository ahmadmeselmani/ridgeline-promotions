import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// The one place the driver adapter is wired, so switching to Postgres (as in
// the qbase reference) is a change to this file and the schema's provider.
export function createPrismaAdapter(url: string): PrismaBetterSqlite3 {
  return new PrismaBetterSqlite3({ url });
}
