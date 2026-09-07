/**
 * Ensures core RBAC roles exist (safe for production).
 * Does NOT create users, departments, or change passwords.
 *
 * Usage on server:
 *   npx tsx scripts/ensure-core-roles.ts
 */
import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "مدير النظام",
    },
  });

  const researcherRole = await prisma.role.upsert({
    where: { name: "RESEARCHER" },
    update: {},
    create: {
      name: "RESEARCHER",
      description: "باحث",
    },
  });

  console.log("OK roles ensured:", {
    ADMIN: adminRole.id,
    RESEARCHER: researcherRole.id,
  });
}

main()
  .catch((e) => {
    console.error("FAIL", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
