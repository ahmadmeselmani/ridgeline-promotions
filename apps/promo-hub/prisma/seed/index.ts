import "dotenv/config";
import { PrismaClient } from "../../src/database/generated/prisma/client";
import { createPrismaAdapter } from "../../src/database/prisma-adapter";
import { seedRulebooks } from "./seeders/rulebook";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ adapter: createPrismaAdapter(url) });
  try {
    const created = await seedRulebooks(prisma);
    console.log(
      created.length > 0
        ? `Seeded rulebooks: ${created.join(", ")}`
        : "Rulebooks already exist — nothing to seed",
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
