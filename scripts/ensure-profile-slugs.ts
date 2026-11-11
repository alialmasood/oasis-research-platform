/**
 * يملأ profileSlug للباحثين الذين لا يملكون رابط سيرة عامة بعد.
 * آمن للتشغيل يدوياً على السيرفر — تسلسلي ويعالج تعارضات P2002.
 *
 * Usage:
 *   npx tsx scripts/ensure-profile-slugs.ts
 *   npx tsx scripts/ensure-profile-slugs.ts --take=500
 *
 * لا يحذف بيانات ولا يزيل قيد التفرد ولا يعدّل الروابط الموجودة.
 */
import "dotenv/config";
import { backfillMissingProfileSlugs } from "../lib/cv/slug";

function parseTake(argv: string[]): number {
  const arg = argv.find((a) => a.startsWith("--take="));
  if (!arg) return 200;
  const n = Number(arg.slice("--take=".length));
  if (!Number.isFinite(n) || n < 1) return 200;
  return Math.min(Math.floor(n), 5000);
}

async function main() {
  const take = parseTake(process.argv.slice(2));
  console.log(`[ensure-profile-slugs] starting sequential backfill (take=${take})`);

  const result = await backfillMissingProfileSlugs({ take });

  console.log("[ensure-profile-slugs] done:", result);
  if (result.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("[ensure-profile-slugs] FAIL", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
