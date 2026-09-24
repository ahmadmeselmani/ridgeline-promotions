import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    // Falls back to the .env.example default so `pnpm install` (which runs
    // `prisma generate`) works on a fresh clone before .env exists.
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
