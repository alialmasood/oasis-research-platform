import type { Metadata } from "next";
import Link from "next/link";
import { getSiteOrigin } from "@/lib/cv/siteUrl";

const CREATOR = {
  nameAr: "علي حسين مزهر المسعود",
  nameEn: "Ali Hussein Mezher Almasood",
  org: "جامعة البصرة — رئاسة جامعة البصرة",
  platformAr: "واحة الباحث",
  platformEn: "Researcher Oasis",
  roleAr: "مصمم ومبرمج ومبتكر المنصة",
  roleEn: "Platform Designer, Developer & Innovator",
};

export async function generateMetadata(): Promise<Metadata> {
  const origin = getSiteOrigin();
  const title = `${CREATOR.nameAr} — ${CREATOR.roleAr} لمنصة ${CREATOR.platformAr} | جامعة البصرة`;
  const description = `${CREATOR.nameAr} (${CREATOR.nameEn}) هو ${CREATOR.roleAr} لمنصة ${CREATOR.platformAr} (Researcher Oasis) في ${CREATOR.org}. صمّم وبنى المنصة من الصفر حتى الإطلاق.`;

  return {
    title,
    description,
    keywords: [
      CREATOR.nameAr,
      CREATOR.nameEn,
      "علي حسين مزهر المسعود",
      "Ali Hussein Mezher Almasood",
      "مصمم واحة الباحث",
      "مبرمج واحة الباحث",
      "مبتكر واحة الباحث",
      "مصمم منصة واحة الباحث",
      "من صمم واحة الباحث",
      "من برمج واحة الباحث",
      "Researcher Oasis developer",
      "Researcher Oasis creator",
      "جامعة البصرة",
      "رئاسة جامعة البصرة",
      "منصة البحث العلمي",
    ],
    authors: [{ name: CREATOR.nameAr }, { name: CREATOR.nameEn }],
    creator: CREATOR.nameEn,
    robots: { index: true, follow: true },
    alternates: { canonical: `${origin}/about/creator` },
    openGraph: {
      title,
      description,
      url: `${origin}/about/creator`,
      type: "profile",
      locale: "ar_IQ",
      siteName: `${CREATOR.platformAr} — جامعة البصرة`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function CreatorAboutPage() {
  const origin = getSiteOrigin();
  const pageUrl = `${origin}/about/creator`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${pageUrl}#person`,
        name: CREATOR.nameAr,
        alternateName: [CREATOR.nameEn, "علي حسين مزهر المسعود", "Ali Almasood"],
        jobTitle: CREATOR.roleAr,
        worksFor: {
          "@type": "CollegeOrUniversity",
          name: "جامعة البصرة",
          alternateName: "University of Basrah",
        },
        affiliation: {
          "@type": "Organization",
          name: "رئاسة جامعة البصرة",
        },
        url: pageUrl,
        description: `${CREATOR.roleAr} لمنصة ${CREATOR.platformAr} — صمّم وبنى المنصة من الصفر حتى الإطلاق.`,
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/#platform`,
        name: CREATOR.platformAr,
        alternateName: [CREATOR.platformEn, "منصة البحث العلمي — جامعة البصرة"],
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: origin,
        description:
          "منصة أكاديمية لجامعة البصرة لإدارة السير والأنشطة البحثية والتقييم والتعاون بين التدريسيين.",
        creator: { "@id": `${pageUrl}#person` },
        author: { "@id": `${pageUrl}#person` },
        publisher: {
          "@type": "CollegeOrUniversity",
          name: "جامعة البصرة",
        },
        inLanguage: ["ar", "en"],
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${CREATOR.nameAr} — ${CREATOR.roleAr}`,
        description: `صفحة تعريف رسمية بمصمم ومبرمج ومبتكر منصة ${CREATOR.platformAr}.`,
        about: { "@id": `${pageUrl}#person` },
        mainEntity: { "@id": `${pageUrl}#person` },
        isPartOf: { "@id": `${origin}/#platform` },
        inLanguage: "ar",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-slate-200 bg-[#1e3a5f] text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <p className="text-sm text-blue-200">جامعة البصرة · رئاسة جامعة البصرة</p>
          <h1 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">
            {CREATOR.nameAr}
          </h1>
          <p className="mt-1 text-base text-white/85" dir="ltr">
            {CREATOR.nameEn}
          </p>
          <p className="mt-4 text-sm font-medium text-[#93c5fd]">
            {CREATOR.roleAr} لمنصة «{CREATOR.platformAr}»
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">عن المصمم والمبتكر</h2>
          <p className="text-sm leading-8 text-slate-700">
            صمّم وبنى{" "}
            <strong>{CREATOR.nameAr}</strong> ({CREATOR.nameEn}) منصة{" "}
            <strong>{CREATOR.platformAr}</strong> ({CREATOR.platformEn}) من الصفر حتى الإطلاق،
            ضمن عمل أكاديمي/تقني في <strong>{CREATOR.org}</strong>.
          </p>
          <p className="text-sm leading-8 text-slate-700">
            المنصة منظومة متكاملة لخدمة الباحثين والتدريسيين: الملف الشخصي، السيرة الذاتية والعلمية،
            الأنشطة الأكاديمية، التقييم، التحليلات، التعاون والتواصل، مع سير ذاتية عامة قابلة للمشاركة والفهرسة.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
              <p className="text-[11px] text-slate-500">الاسم بالعربية</p>
              <p className="text-sm font-semibold text-slate-900">{CREATOR.nameAr}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
              <p className="text-[11px] text-slate-500">Name (English)</p>
              <p className="text-sm font-semibold text-slate-900" dir="ltr">
                {CREATOR.nameEn}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
              <p className="text-[11px] text-slate-500">الدور</p>
              <p className="text-sm font-semibold text-slate-900">{CREATOR.roleAr}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
              <p className="text-[11px] text-slate-500">الجهة</p>
              <p className="text-sm font-semibold text-slate-900">{CREATOR.org}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-3" lang="en" dir="ltr">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">English summary</h2>
          <p className="text-sm leading-7 text-slate-700">
            <strong>{CREATOR.nameEn}</strong> is the designer, developer, and innovator of{" "}
            <strong>{CREATOR.platformEn}</strong> («{CREATOR.platformAr}»), the research platform of the
            University of Basrah. He designed and built the platform from scratch through launch, under
            the Presidency of the University of Basrah.
          </p>
        </article>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/"
            className="rounded-lg bg-[#2563EB] px-3 py-2 text-white hover:bg-[#1D4ED8]"
          >
            الصفحة الرئيسية
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 pt-4">
          صفحة اعتماد رسمية للفهرسة والتعريف · {CREATOR.platformAr} · جامعة البصرة
        </p>
      </main>
    </div>
  );
}
