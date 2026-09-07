import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name='_prisma_migrations'`
  );
  console.log("HAS_PRISMA_MIGRATIONS_TABLE", tables.length > 0);

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
      applied_steps_count: number;
    }>
  >(
    `SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
     FROM _prisma_migrations
     ORDER BY started_at ASC`
  );
  console.log(
    "APPLIED_ROWS",
    JSON.stringify(
      rows.map((r) => ({
        migration_name: r.migration_name,
        finished: !!r.finished_at,
        rolled_back: !!r.rolled_back_at,
        steps: r.applied_steps_count,
      })),
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
