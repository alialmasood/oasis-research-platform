import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/middleware";
import { getFullCvData } from "@/lib/cv/getFullCvData";
import { buildPublicCvAbsoluteUrl } from "@/lib/cv/slug";
import { CvDocument } from "@/components/cv/CvDocument";
import { CvToolbar } from "@/components/cv/CvToolbar";
import "@/components/cv/cv-print.css";

export const metadata = {
  title: "تصدير السيرة الذاتية",
};

export default async function ResearcherCvExportPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.roles?.includes("RESEARCHER")) redirect("/login");

  const data = await getFullCvData(user.id);
  if (!data) redirect("/researcher/cv");

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const publicUrl =
    data.cvPublicEnabled && data.profileSlug
      ? buildPublicCvAbsoluteUrl(origin, data.profileSlug)
      : null;

  const displayName =
    data.identity.fullNameAr || data.identity.fullNameEn || "الباحث";

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <CvToolbar
        publicUrl={publicUrl}
        researcherName={displayName}
        showShare={Boolean(publicUrl)}
      />
      <div className="cv-no-print mx-auto max-w-[210mm] px-3 py-3 text-[12px] text-slate-600">
        {publicUrl ? (
          <p>
            رابط السيرة العامة:{" "}
            <a
              href={publicUrl}
              className="font-medium text-[#2563EB] underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {publicUrl}
            </a>
          </p>
        ) : (
          <p>المشاركة العامة غير مفعّلة حالياً لهذه السيرة.</p>
        )}
      </div>
      <div className="px-2 py-4 sm:px-4">
        <CvDocument data={data} avatarSrc={data.identity.avatarSrc} mode="export" />
      </div>
    </div>
  );
}
