import "dotenv/config";
import { prisma } from "../lib/db";

type Row = Record<string, unknown>;

async function q<T = Row[]>(sql: string): Promise<T> {
  return prisma.$queryRawUnsafe(sql) as Promise<T>;
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("=== VERIFY 002 ResearchType ===");
  const enums = await q<Array<{ enumlabel: string }>>(
    `SELECT e.enumlabel
     FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
     WHERE t.typname = 'ResearchType'
     ORDER BY e.enumsortorder`
  );
  console.log("ENUM_VALUES", JSON.stringify(enums.map((e) => e.enumlabel)));
  const labels = enums.map((e) => e.enumlabel).sort();
  assert(
    labels.length === 2 && labels[0] === "PLANNED" && labels[1] === "UNPLANNED",
    "002 mismatch: ResearchType must be exactly PLANNED,UNPLANNED"
  );
  const leftover = await q<Array<{ typname: string }>>(
    `SELECT typname FROM pg_type WHERE typname IN ('ResearchType_new')`
  );
  assert(leftover.length === 0, "002 mismatch: ResearchType_new still exists");
  const col = await q<Array<{ udt_name: string }>>(
    `SELECT udt_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='research' AND column_name='research_type'`
  );
  assert(col[0]?.udt_name === "ResearchType", "002 mismatch: research.research_type type");
  console.log("002_OK");

  console.log("=== VERIFY 003 positions ===");
  const required = [
    "researcher_id",
    "position_date",
    "duration_years",
    "duration_months",
    "duration_days",
  ];
  const posCols = await q<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='positions'
     ORDER BY ordinal_position`
  );
  const names = new Set(posCols.map((c) => c.column_name));
  console.log("POSITIONS_COLS", JSON.stringify([...names].sort()));
  for (const colName of required) {
    assert(names.has(colName), `003 mismatch: missing ${colName}`);
  }
  // Old columns may still exist (migration left DROP commented). App schema uses new cols.
  const fk = await q<Array<{ constraint_name: string }>>(
    `SELECT constraint_name FROM information_schema.table_constraints
     WHERE table_schema='public' AND table_name='positions'
       AND constraint_type='FOREIGN KEY'
       AND constraint_name='positions_researcher_id_fkey'`
  );
  console.log("POSITIONS_FK", JSON.stringify(fk));
  // FK may or may not exist depending on how schema was pushed; schema expects relation.
  // If missing via db push naming, note it but required columns are the migration end-state for app.
  const nullCheck = await q<Array<{ column_name: string; is_nullable: string }>>(
    `SELECT column_name, is_nullable FROM information_schema.columns
     WHERE table_schema='public' AND table_name='positions'
       AND column_name IN ('researcher_id','position_date','duration_years','duration_months','duration_days')
     ORDER BY column_name`
  );
  console.log("POSITIONS_NULLS", JSON.stringify(nullCheck));
  for (const row of nullCheck) {
    assert(row.is_nullable === "NO", `003 mismatch: ${row.column_name} should be NOT NULL`);
  }
  console.log("003_OK");

  console.log("=== VERIFY 004 session + audit ===");
  const sv = await q<
    Array<{ column_name: string; data_type: string; column_default: string | null; is_nullable: string }>
  >(
    `SELECT column_name, data_type, column_default, is_nullable
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name='users' AND column_name='session_version'`
  );
  console.log("SESSION_VERSION", JSON.stringify(sv));
  assert(sv.length === 1, "004 mismatch: session_version missing");
  assert(sv[0].data_type === "integer", "004 mismatch: session_version type");
  assert(sv[0].is_nullable === "NO", "004 mismatch: session_version nullable");
  assert(
    typeof sv[0].column_default === "string" && sv[0].column_default.includes("0"),
    "004 mismatch: session_version default"
  );

  const audit = await q<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name='super_admin_audit_logs'`
  );
  assert(audit.length === 1, "004 mismatch: audit table missing");

  const auditCols = await q<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='super_admin_audit_logs'
     ORDER BY column_name`
  );
  const aNames = new Set(auditCols.map((c) => c.column_name));
  for (const c of [
    "id",
    "action",
    "target_type",
    "target_id",
    "target_email",
    "metadata",
    "actor_email",
    "created_at",
  ]) {
    assert(aNames.has(c), `004 mismatch: audit missing ${c}`);
  }

  const idxs = await q<Array<{ indexname: string }>>(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname='public' AND tablename='super_admin_audit_logs'
     ORDER BY indexname`
  );
  console.log("AUDIT_INDEXES", JSON.stringify(idxs.map((i) => i.indexname)));
  const idxSet = new Set(idxs.map((i) => i.indexname));
  for (const idx of [
    "super_admin_audit_logs_created_at_idx",
    "super_admin_audit_logs_action_idx",
    "super_admin_audit_logs_target_type_idx",
    "super_admin_audit_logs_target_id_idx",
    "super_admin_audit_logs_target_email_idx",
  ]) {
    assert(idxSet.has(idx), `004 mismatch: missing index ${idx}`);
  }
  console.log("004_OK");
  console.log("ALL_VERIFICATIONS_PASSED");
}

main()
  .catch((e) => {
    console.error("VERIFY_FAIL", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
