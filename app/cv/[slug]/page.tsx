import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFullCvDataBySlug } from "@/lib/cv/getFullCvData";
import { buildPublicCvAbsoluteUrl } from "@/lib/cv/slug";
import { getSiteOrigin } from "@/lib/cv/siteUrl";
import { CvDocument } from "@/components/cv/CvDocument";
import { CvToolbar } from "@/components/cv/CvToolbar";
import "@/components/cv/cv-print.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getFullCvDataBySlug(slug);
  const origin = getSiteOrigin();

  if (!data) {
    return {
      title: "السيرة الذاتية غير متاحة",
      robots: { index: false, follow: false },
    };
  }

  const nameAr = data.identity.fullNameAr;
  const nameEn = data.identity.fullNameEn;
  const name = nameAr || nameEn || "باحث";
  const titleParts = [
    name,
    data.identity.academicTitle,
    "جامعة البصرة",
  ].filter(Boolean);
  const title = titleParts.join(" · ");
  const description = [
    data.identity.headline,
    data.identity.bio?.slice(0, 140),
    [data.identity.entity, data.identity.department].filter(Boolean).join(" — "),
    [data.identity.generalSpecialization, data.identity.specificSpecialization]
      .filter(Boolean)
      .join(" / "),
    `السيرة الأكاديمية والأنشطة البحثية لـ ${name} على منصة البحث العلمي — جامعة البصرة.`,
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 300);

  const url = data.profileSlug
    ? buildPublicCvAbsoluteUrl(origin, data.profileSlug)
    : `${origin}/cv/${slug}`;

  const images = data.identity.avatarSrc
    ? [{ url: data.identity.avatarSrc.startsWith("http") ? data.identity.avatarSrc : `${origin}${data.identity.avatarSrc}` }]
    : undefined;

  return {
    title,
    description,
    keywords: [
      nameAr,
      nameEn,
      data.identity.academicTitle,
      data.identity.department,
      data.identity.entity,
      data.identity.generalSpecialization,
      data.identity.specificSpecialization,
      "جامعة البصرة",
      "باحث",
      "سيرة ذاتية أكاديمية",
      "منصة البحث العلمي",
    ].filter(Boolean) as string[],
    authors: [{ name }],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      locale: "ar_IQ",
      siteName: "منصة البحث العلمي - جامعة البصرة",
      images,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

function buildJsonLd(data: NonNullable<Awaited<ReturnType<typeof getFullCvDataBySlug>>>, url: string) {
  const name = data.identity.fullNameAr || data.identity.fullNameEn || "باحث";
  const sameAs = data.links
    ? [
        data.links.googleScholar,
        data.links.researchGate,
        data.links.orcid,
        data.links.scopus,
        data.links.webOfScience,
        data.links.linkedIn,
        data.links.personalWebsite,
        data.links.github,
      ].filter(Boolean)
    : [];

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `السيرة الأكاديمية — ${name}`,
    url,
    mainEntity: {
      "@type": "Person",
      name,
      alternateName: data.identity.fullNameEn || undefined,
      jobTitle: data.identity.academicTitle || undefined,
      email: data.identity.email || undefined,
      telephone: data.identity.phone || undefined,
      image: data.identity.avatarSrc || undefined,
      description: data.identity.bio || data.identity.headline || undefined,
      worksFor: {
        "@type": "CollegeOrUniversity",
        name: "جامعة البصرة",
        department: data.identity.department || undefined,
      },
      affiliation: data.identity.entity
        ? { "@type": "Organization", name: data.identity.entity }
        : undefined,
      knowsAbout: [
        data.identity.generalSpecialization,
        data.identity.specificSpecialization,
      ].filter(Boolean),
      sameAs: sameAs.length ? sameAs : undefined,
      url,
    },
  };
}

export default async function PublicCvPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getFullCvDataBySlug(slug);
  if (!data) notFound();

  const origin = getSiteOrigin();
  const publicUrl = data.profileSlug
    ? buildPublicCvAbsoluteUrl(origin, data.profileSlug)
    : null;

  const displayName =
    data.identity.fullNameAr || data.identity.fullNameEn || "الباحث";

  const jsonLd = publicUrl ? buildJsonLd(data, publicUrl) : null;

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <CvToolbar
        publicUrl={publicUrl}
        researcherName={displayName}
        showShare={Boolean(publicUrl)}
      />
      <div className="cv-no-print mx-auto max-w-[210mm] px-3 pt-3 text-[11px] text-slate-500">
        صفحة عامة للقراءة فقط — لا يمكن للزائر تعديل البيانات أو الدخول إلى الحساب.
      </div>
      <div className="px-2 py-4 sm:px-4">
        <CvDocument data={data} avatarSrc={data.identity.avatarSrc} mode="public" />
      </div>
    </div>
  );
}
