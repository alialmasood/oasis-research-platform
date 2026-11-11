import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSiteOrigin } from "@/lib/cv/siteUrl";
import { buildPublicCvPath } from "@/lib/cv/slug";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  const origin = getSiteOrigin();
  return {
    title: "دليل الباحثين — منصة البحث العلمي | جامعة البصرة",
    description:
      "دليل علني لباحثي وتدريسيي جامعة البصرة: السير الذاتية والأنشطة الأكاديمية قابلة للمشاهدة والبحث عبر الإنترنت.",
    robots: { index: true, follow: true },
    alternates: { canonical: `${origin}/researchers` },
    openGraph: {
      title: "دليل الباحثين — جامعة البصرة",
      description: "اطّلع على السير الأكاديمية للباحثين والتدريسيين في جامعة البصرة.",
      url: `${origin}/researchers`,
      type: "website",
      locale: "ar_IQ",
    },
  };
}

/**
 * دليل الباحثين للقراءة فقط.
 * لا يكتب على قاعدة البيانات أثناء البناء/التوليد —
 * الروابط الناقصة تُملأ عبر التسجيل أو تصدير السيرة أو السكربت المستقل.
 */
export default async function PublicResearchersDirectoryPage() {
  const researchers = await prisma.user.findMany({
    where: {
      role: "RESEARCHER",
      isActive: true,
      cvPublicEnabled: true,
      profileSlug: { not: null },
    },
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      academicTitle: true,
      entity: true,
      department: true,
      generalSpecialization: true,
      specificSpecialization: true,
      profileSlug: true,
      researcherProfile: {
        select: { headline: true, avatarData: true },
      },
    },
    orderBy: [{ fullNameAr: "asc" }, { fullNameEn: "asc" }],
    take: 2000,
  });

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="border-b border-slate-200 bg-[#1e3a5f] text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-sm text-blue-200">جامعة البصرة · منصة البحث العلمي</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">دليل الباحثين والتدريسيين</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80 leading-relaxed">
            صفحات عامة للقراءة فقط — يمكن لأي شخص الاطلاع على السيرة والأنشطة الأكاديمية دون تسجيل دخول،
            ودون إمكانية التعديل على الحساب.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {researchers.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            لا يوجد باحثون منشورون حالياً.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {researchers.map((r) => {
              const name = r.fullNameAr || r.fullNameEn || "باحث";
              const href = buildPublicCvPath(r.profileSlug!);
              const specs = [r.generalSpecialization, r.specificSpecialization]
                .filter(Boolean)
                .join(" — ");
              return (
                <li key={r.id}>
                  <Link
                    href={href}
                    className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-lg font-bold text-[#1e3a5f]">
                      {r.researcherProfile?.avatarData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/avatar/${r.id}`}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        name.trim().charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {r.academicTitle ? (
                        <p className="text-[11px] text-blue-700 font-medium">{r.academicTitle}</p>
                      ) : null}
                      <h2 className="text-sm font-semibold text-slate-900 truncate">{name}</h2>
                      {r.fullNameEn && r.fullNameAr ? (
                        <p className="text-[11px] text-slate-500 truncate" dir="ltr">
                          {r.fullNameEn}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-[11px] text-slate-600 truncate">
                        {[r.entity, r.department].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {specs ? (
                        <p className="text-[10px] text-slate-500 truncate">{specs}</p>
                      ) : null}
                      {r.researcherProfile?.headline ? (
                        <p className="mt-1 text-[10px] text-slate-500 line-clamp-2">
                          {r.researcherProfile.headline}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          المشاهدة عامة · التعديل متاح لصاحب الحساب فقط بعد تسجيل الدخول
        </p>
      </main>
    </div>
  );
}
