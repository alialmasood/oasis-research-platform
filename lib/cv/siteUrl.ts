/**
 * عنوان المنصة العام المستخدم في الروابط والفهرسة (Google).
 * الأفضل ضبط NEXTAUTH_URL أو NEXT_PUBLIC_SITE_URL على الدومين الحقيقي في الإنتاج.
 */
export function getSiteOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (fromEnv) {
    if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
      return fromEnv.replace(/\/$/, "");
    }
    return `https://${fromEnv.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}
