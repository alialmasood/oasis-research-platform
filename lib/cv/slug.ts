import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const RESERVED = new Set([
  "login",
  "register",
  "researcher",
  "admin",
  "super-admin",
  "api",
  "cv",
  "u",
  "p",
  "print",
  "about",
  "researchers",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "humans.txt",
]);

/** أقصى محاولات لتعيين رابط فريد عند التعارض المتزامن */
export const PROFILE_SLUG_MAX_ATTEMPTS = 12;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

/** يحوّل الاسم الإنجليزي إلى slug صالح للرابط */
export function slugifyEnglishName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);

  return base || "researcher";
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug.toLowerCase());
}

/** يبني مرشّح رابط مع لاحقة رقمية عند الحاجة */
export function buildSlugCandidate(base: string, attempt: number, userId: string): string {
  if (attempt <= 1) return base;
  if (attempt >= PROFILE_SLUG_MAX_ATTEMPTS) {
    return `${base}-${userId.slice(-6).toLowerCase()}`;
  }
  return `${base}-${attempt}`;
}

function desiredBaseFromNames(
  fullNameEn: string | null | undefined,
  fullNameAr: string | null | undefined,
  userId: string
): string {
  const source = fullNameEn?.trim() || fullNameAr?.trim() || userId;
  let desired = slugifyEnglishName(source);
  if (isReservedSlug(desired)) desired = `${desired}-cv`;
  return desired;
}

type UserSlugRow = {
  id: string;
  fullNameEn: string | null;
  fullNameAr: string | null;
  profileSlug: string | null;
};

async function readUserSlugRow(userId: string): Promise<UserSlugRow | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullNameEn: true, fullNameAr: true, profileSlug: true },
  });
}

/**
 * يضمن وجود profileSlug فريد للمستخدم ويُرجعه.
 * - إن وُجد رابط صالح حالياً يُعاد كما هو دون تعديل.
 * - يُنشأ رابط جديد فقط عند الغياب، مع معالجة آمنة لتعارض P2002.
 */
export async function ensureUserProfileSlug(userId: string): Promise<string | null> {
  const user = await readUserSlugRow(userId);
  if (!user) return null;

  // حافظ على الرابط الحالي إن كان موجوداً وصالحاً
  if (user.profileSlug?.trim()) {
    return user.profileSlug.trim();
  }

  const base = desiredBaseFromNames(user.fullNameEn, user.fullNameAr, user.id);

  for (let attempt = 1; attempt <= PROFILE_SLUG_MAX_ATTEMPTS; attempt++) {
    // أعد القراءة قبل كل محاولة — قد يكون طلب متزامن قد عيّن الرابط
    const latest = await readUserSlugRow(userId);
    if (!latest) return null;
    if (latest.profileSlug?.trim()) {
      return latest.profileSlug.trim();
    }

    const candidate = buildSlugCandidate(base, attempt, userId);

    // تخطَّ المرشّح إن كان محجوزاً أو مأخوذاً مسبقاً (تقليل تعارضات متوقعة)
    if (isReservedSlug(candidate)) {
      continue;
    }
    const taken = await prisma.user.findFirst({
      where: { profileSlug: candidate },
      select: { id: true },
    });
    if (taken) {
      continue;
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { profileSlug: candidate },
        select: { profileSlug: true },
      });
      if (updated.profileSlug?.trim()) {
        return updated.profileSlug.trim();
      }
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      // تعارض فريد متزامن: أعد قراءة حالة المستخدم
      const afterConflict = await readUserSlugRow(userId);
      if (afterConflict?.profileSlug?.trim()) {
        return afterConflict.profileSlug.trim();
      }
      // جرّب مرشّحاً تالياً في الحلقة
    }
  }

  // فشلت كل المحاولات — أعد الحالة الحالية دون رمي خطأ يُسقط الصفحة
  const finalRow = await readUserSlugRow(userId);
  return finalRow?.profileSlug?.trim() || null;
}

/**
 * يملأ الروابط الناقصة لدفعة من الباحثين بشكل تسلسلي.
 * مخصّص للسكربتات/العمليات الخلفية — لا يُستدعى من بناء صفحات الدليل.
 */
export async function backfillMissingProfileSlugs(options?: {
  take?: number;
}): Promise<{ processed: number; assigned: number; failed: number }> {
  const take = options?.take ?? 200;
  const missing = await prisma.user.findMany({
    where: {
      role: "RESEARCHER",
      isActive: true,
      profileSlug: null,
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take,
  });

  let assigned = 0;
  let failed = 0;

  for (const row of missing) {
    try {
      const slug = await ensureUserProfileSlug(row.id);
      if (slug) assigned += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  return { processed: missing.length, assigned, failed };
}

export function buildPublicCvPath(slug: string): string {
  return `/cv/${slug}`;
}

export function buildPublicCvAbsoluteUrl(origin: string, slug: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${buildPublicCvPath(slug)}`;
}
