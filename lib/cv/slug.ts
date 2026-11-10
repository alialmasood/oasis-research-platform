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
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

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

/**
 * يضمن وجود profileSlug فريد للمستخدم ويُرجعه.
 * يُحدَّث إن تغيّر الاسم الإنجليزي ولم يتعارض مع مستخدم آخر.
 */
export async function ensureUserProfileSlug(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullNameEn: true, fullNameAr: true, profileSlug: true },
  });
  if (!user) return null;

  const source = user.fullNameEn?.trim() || user.fullNameAr?.trim() || user.id;
  let desired = slugifyEnglishName(source);
  if (isReservedSlug(desired)) desired = `${desired}-cv`;

  if (user.profileSlug === desired) return user.profileSlug;

  if (user.profileSlug) {
    const conflictOnDesired = await prisma.user.findFirst({
      where: { profileSlug: desired, NOT: { id: userId } },
      select: { id: true },
    });
    if (!conflictOnDesired) {
      await prisma.user.update({
        where: { id: userId },
        data: { profileSlug: desired },
      });
      return desired;
    }
    return user.profileSlug;
  }

  let candidate = desired;
  let n = 2;
  while (true) {
    const taken = await prisma.user.findFirst({
      where: { profileSlug: candidate },
      select: { id: true },
    });
    if (!taken) break;
    candidate = `${desired}-${n}`;
    n += 1;
    if (n > 99) {
      candidate = `${desired}-${userId.slice(-6).toLowerCase()}`;
      break;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { profileSlug: candidate },
  });
  return candidate;
}

export function buildPublicCvPath(slug: string): string {
  return `/cv/${slug}`;
}

export function buildPublicCvAbsoluteUrl(origin: string, slug: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${buildPublicCvPath(slug)}`;
}
