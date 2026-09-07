import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = '_prisma_migrations'`
  );
  console.log("HAS_PRISMA_MIGRATIONS_TABLE", tables.length > 0);

  if (tables.length > 0) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at, applied_steps_count, rolled_back_at
       FROM _prisma_migrations ORDER BY started_at ASC`
    );
    console.log("MIGRATION_ROWS", JSON.stringify(rows, null, 2));
  } else {
    console.log("MIGRATION_ROWS", "NONE");
  }

  const cols = await prisma.$queryRawUnsafe(
    `SELECT column_name, data_type, column_default, is_nullable
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name='users' AND column_name='session_version'`
  );
  console.log("SESSION_VERSION_COL", JSON.stringify(cols));

  const audit = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name='super_admin_audit_logs'`
  );
  console.log("AUDIT_TABLE", JSON.stringify(audit));

  const researchType = await prisma.$queryRawUnsafe(
    `SELECT e.enumlabel
     FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
     WHERE t.typname = 'ResearchType' ORDER BY e.enumsortorder`
  );
  console.log("RESEARCH_TYPE_ENUM", JSON.stringify(researchType));

  const posCols = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='positions'
       AND column_name IN ('user_id','start_date','end_date','is_current','researcher_id','position_date','duration_years')
     ORDER BY column_name`
  );
  console.log("POSITIONS_KEY_COLS", JSON.stringify(posCols));

  const funcs = await prisma.$queryRawUnsafe(
    `SELECT routine_name FROM information_schema.routines
     WHERE routine_schema='public' AND routine_name IN ('hash_password','verify_login')`
  );
  console.log("DB_FUNCTIONS", JSON.stringify(funcs));

  const userCount = await prisma.user.count();
  console.log("USER_COUNT", userCount);
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
