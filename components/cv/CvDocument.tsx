import type { ReactNode } from "react";
import type { FullCvData, CvListItem } from "@/lib/cv/getFullCvData";

export type CvDocumentProps = {
  data: FullCvData;
  /** absolute or path for photo, e.g. /api/avatar/{userId} */
  avatarSrc?: string | null;
  /** show "صفحة عامة" watermark/footer note */
  mode?: "export" | "public";
};

type ResearchLinkKey = Exclude<keyof NonNullable<FullCvData["links"]>, "otherLinks">;

const ACTIVITY_SECTIONS: Array<{
  key: keyof FullCvData["activities"];
  title: string;
  headers: [string, string, string, string];
}> = [
  { key: "research", title: "البحوث", headers: ["العنوان", "الناشر / DOI", "السنة", "الحالة"] },
  { key: "conferences", title: "المؤتمرات", headers: ["العنوان", "الجهة / المكان", "السنة", "المشاركة"] },
  { key: "positions", title: "المناصب", headers: ["المنصب", "الجهة", "السنة", "المدة"] },
  { key: "seminars", title: "الندوات", headers: ["العنوان", "الجهة / المكان", "السنة", "المشاركة"] },
  { key: "courses", title: "الدورات", headers: ["العنوان", "الجهة / المكان", "السنة", "المشاركة"] },
  { key: "workshops", title: "ورش العمل", headers: ["العنوان", "الجهة / المكان", "السنة", "المشاركة"] },
  { key: "assignments", title: "التكليفات", headers: ["موضوع التكليف", "الحالة", "السنة", "ملاحظات"] },
  { key: "thanks", title: "كتب الشكر", headers: ["الجهة المانحة", "التوجيه", "السنة", "المشاركة"] },
  { key: "committees", title: "اللجان", headers: ["عنوان اللجنة", "الدور", "السنة", "ملاحظات"] },
  { key: "certificates", title: "الشهادات", headers: ["عنوان الشهادة", "الجهة المانحة", "السنة", ""] },
  { key: "journals", title: "المجلات", headers: ["اسم المجلة", "الدور", "السنة", "الفترة"] },
  { key: "supervision", title: "الإشراف", headers: ["اسم الطالب", "عنوان الرسالة", "السنة", "التفاصيل"] },
  { key: "reviewing", title: "التقويم العلمي", headers: ["العنوان", "النوع", "السنة", "الحالة"] },
  { key: "volunteering", title: "التطوع", headers: ["العنوان", "الجهة / الموقع", "السنة", "الدور"] },
  { key: "fieldVisits", title: "الزيارات الميدانية", headers: ["العنوان", "النوع", "السنة", "ملاحظات"] },
];

const LINK_LABELS: Array<{ key: ResearchLinkKey; label: string }> = [
  { key: "googleScholar", label: "Google Scholar" },
  { key: "researchGate", label: "ResearchGate" },
  { key: "webOfScience", label: "Web of Science" },
  { key: "scopus", label: "Scopus" },
  { key: "orcid", label: "ORCID" },
  { key: "linkedIn", label: "LinkedIn" },
  { key: "pubmed", label: "PubMed" },
  { key: "github", label: "GitHub" },
  { key: "personalWebsite", label: "الموقع الشخصي" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5 break-inside-avoid">
      <h2 className="mb-2 flex items-center gap-2 border-b border-[#1e3a5f]/20 pb-1.5 text-[13pt] font-bold text-[#1e3a5f]">
        <span
          className="inline-block h-4 w-1 shrink-0 rounded-sm bg-[#2563EB]"
          aria-hidden
        />
        {title}
      </h2>
      {children}
    </section>
  );
}

function CvTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | null | undefined>>;
}) {
  const activeHeaders = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => Boolean(h));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[8.5pt] sm:text-[9pt]">
        <thead>
          <tr className="bg-[#1e3a5f] text-white">
            {activeHeaders.map(({ h, i }) => (
              <th
                key={`${h}-${i}`}
                className="border border-[#1e3a5f] px-2 py-1.5 text-right font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}
            >
              {activeHeaders.map(({ i }) => {
                const cell = row[i] ?? "—";
                const isUrl = typeof cell === "string" && /^https?:\/\//i.test(cell);
                return (
                  <td
                    key={`${ri}-${i}`}
                    className={`border border-[#1e3a5f]/15 px-2 py-1.5 align-top text-[#0f172a] ${
                      isUrl ? "break-all" : ""
                    }`}
                    dir={isUrl ? "ltr" : undefined}
                  >
                    {isUrl ? (
                      <a
                        href={cell}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] underline print:text-[#0f172a] print:no-underline"
                      >
                        {cell}
                      </a>
                    ) : (
                      cell || "—"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTable({
  items,
  headers,
}: {
  items: CvListItem[];
  headers: [string, string, string, string];
}) {
  return (
    <CvTable
      headers={headers}
      rows={items.map((item) => [
        item.title,
        item.subtitle || "—",
        item.year != null && item.year !== "" ? String(item.year) : "—",
        item.meta || "—",
      ])}
    />
  );
}

function PersonalRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[9.5pt]">
      <span className="shrink-0 font-semibold text-[#1e3a5f]">{label}:</span>
      <span className="text-[#334155]">{value}</span>
    </div>
  );
}

function collectResearchLinks(links: FullCvData["links"]) {
  if (!links) return [] as Array<{ label: string; url: string }>;
  const out: Array<{ label: string; url: string }> = [];
  for (const { key, label } of LINK_LABELS) {
    const url = links[key];
    if (typeof url === "string" && url.trim()) {
      out.push({ label, url: url.trim() });
    }
  }
  for (const o of links.otherLinks ?? []) {
    if (o.url?.trim()) out.push({ label: o.label || "رابط إضافي", url: o.url.trim() });
  }
  return out;
}

export function CvDocument({
  data,
  avatarSrc,
  mode = "export",
}: CvDocumentProps) {
  const { identity, personal, degrees, experiences, languages, skills, links, activities } =
    data;

  const exportDate = new Date().toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const entityLine = [identity.entity, identity.department]
    .filter(Boolean)
    .join(" · ");

  const specs = [identity.generalSpecialization, identity.specificSpecialization]
    .filter(Boolean)
    .join(" — ");

  const researchLinks = collectResearchLinks(links);

  const personalEntries: Array<[string, string | null | undefined]> = [
    ["الجنسية", personal.nationality],
    ["المحافظة", personal.province],
    ["القضاء", personal.district],
    ["المنطقة", personal.area],
    ["العنوان", personal.address],
    ["تاريخ الميلاد", personal.dateOfBirth],
    ["الجنس", personal.gender],
    [
      "سنة التعيين",
      identity.appointmentYear != null ? String(identity.appointmentYear) : null,
    ],
  ];
  const hasPersonal = personalEntries.some(([, v]) => Boolean(v));

  const hasLanguages = languages.length > 0;
  const hasSkills = skills.length > 0;

  const photoSrc =
    avatarSrc ||
    identity.avatarSrc ||
    (identity.hasAvatar ? `/api/avatar/${data.userId}` : null);

  return (
    <article
      dir="rtl"
      lang="ar"
      className="cv-sheet mx-auto max-w-[210mm] bg-white text-[#0f172a] print:max-w-none"
    >
      <div className="relative overflow-hidden border border-[#1e3a5f]/15 print:border-0">
        <header className="relative border-b-2 border-[#2563EB] bg-[#1e3a5f] px-5 py-5 text-white sm:px-7">
          {mode === "public" ? (
            <span className="absolute left-3 top-2 text-[8pt] font-medium tracking-wide text-white/50">
              صفحة عامة
            </span>
          ) : null}

          <div className="flex items-start gap-4 sm:gap-5">
            {photoSrc ? (
              <div className="h-[32mm] w-[32mm] shrink-0 overflow-hidden rounded-lg border-2 border-white/50 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoSrc}
                  alt={identity.fullNameAr || identity.fullNameEn || "صورة شخصية"}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div
                className="flex h-[32mm] w-[32mm] shrink-0 items-center justify-center rounded-lg border-2 border-white/30 bg-white/10 text-[16pt] font-bold text-white/70"
                aria-hidden
              >
                {(identity.fullNameAr || identity.fullNameEn || "؟")
                  .trim()
                  .charAt(0)}
              </div>
            )}

            <div className="min-w-0 flex-1 text-right">
              {identity.academicTitle ? (
                <p className="mb-0.5 text-[9.5pt] font-medium text-[#93c5fd]">
                  {identity.academicTitle}
                </p>
              ) : null}
              <h1 className="text-[16pt] font-extrabold leading-tight tracking-tight sm:text-[18pt]">
                {identity.fullNameAr || identity.fullNameEn || "باحث"}
              </h1>
              {identity.fullNameEn && identity.fullNameAr ? (
                <p className="mt-0.5 text-[10pt] font-medium text-white/80" dir="ltr">
                  {identity.fullNameEn}
                </p>
              ) : null}
              {entityLine ? (
                <p className="mt-1.5 text-[9.5pt] text-white/85">{entityLine}</p>
              ) : null}
              {specs ? (
                <p className="mt-1 text-[9pt] text-[#93c5fd]">{specs}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/20 pt-3 text-[8.5pt] text-white/90">
            {identity.email ? (
              <span dir="ltr" className="inline-flex items-center gap-1">
                <span aria-hidden className="opacity-70">✉</span>
                {identity.email}
              </span>
            ) : null}
            {identity.phone ? (
              <span dir="ltr" className="inline-flex items-center gap-1">
                <span aria-hidden className="opacity-70">☎</span>
                {identity.phone}
              </span>
            ) : null}
            {identity.employeeNumber ? (
              <span className="inline-flex items-center gap-1">
                <span className="opacity-70">الرقم الوظيفي:</span>
                {identity.employeeNumber}
              </span>
            ) : null}
          </div>
        </header>

        <div className="px-5 py-5 sm:px-7">
          {(identity.headline || identity.bio) && (
            <div className="mb-5 rounded-sm border border-[#1e3a5f]/12 bg-[#f8fafc] px-3 py-2.5">
              {identity.headline ? (
                <p className="text-[10.5pt] font-semibold text-[#1e3a5f]">
                  {identity.headline}
                </p>
              ) : null}
              {identity.bio ? (
                <p
                  className={`text-[9.5pt] leading-relaxed text-[#475569] ${
                    identity.headline ? "mt-1" : ""
                  }`}
                >
                  {identity.bio}
                </p>
              ) : null}
            </div>
          )}

          {hasPersonal ? (
            <Section title="البيانات الشخصية">
              <div className="grid grid-cols-1 gap-y-1.5 gap-x-4 sm:grid-cols-2">
                {personalEntries.map(([label, value]) => (
                  <PersonalRow key={label} label={label} value={value} />
                ))}
              </div>
            </Section>
          ) : null}

          {degrees.length > 0 ? (
            <Section title="المؤهلات العلمية">
              <CvTable
                headers={["الدرجة", "الجامعة", "البلد", "التخصص", "سنة التخرج"]}
                rows={degrees.map((d) => [
                  d.degree,
                  d.university,
                  d.country,
                  [d.majorGeneral, d.majorSpecific].filter(Boolean).join(" — ") || "—",
                  String(d.year),
                ])}
              />
            </Section>
          ) : null}

          {experiences.length > 0 ? (
            <Section title="الخبرات">
              <CvTable
                headers={["المسمى الوظيفي", "الجهة", "الفترة", "الوصف"]}
                rows={experiences.map((e) => [
                  e.title,
                  e.organization || "—",
                  e.period,
                  e.description || "—",
                ])}
              />
            </Section>
          ) : null}

          {(hasLanguages || hasSkills) && (
            <Section title="اللغات والمهارات">
              <div
                className={`grid gap-4 ${
                  hasLanguages && hasSkills ? "sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {hasLanguages ? (
                  <CvTable
                    headers={["اللغة", "المستوى"]}
                    rows={languages.map((l) => [l.name, l.level])}
                  />
                ) : null}
                {hasSkills ? (
                  <CvTable
                    headers={["المهارة", "المستوى"]}
                    rows={skills.map((s) => [s.name, s.level])}
                  />
                ) : null}
              </div>
            </Section>
          )}

          {researchLinks.length > 0 ? (
            <Section title="الروابط البحثية">
              <CvTable
                headers={["نوع الرابط", "الرابط الكامل"]}
                rows={researchLinks.map((link) => [link.label, link.url])}
              />
            </Section>
          ) : null}

          {ACTIVITY_SECTIONS.map(({ key, title, headers }) => {
            const items = activities[key];
            if (!items || items.length === 0) return null;
            return (
              <Section key={key} title={title}>
                <ActivityTable items={items} headers={headers} />
              </Section>
            );
          })}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1e3a5f]/20 bg-[#f8fafc] px-5 py-2.5 text-[8pt] text-[#64748b] sm:px-7">
          <span>
            جامعة البصرة · واحة الباحث
            {mode === "public" ? " · صفحة عامة" : ""}
          </span>
          <span>تاريخ التصدير: {exportDate}</span>
        </footer>
      </div>
    </article>
  );
}

export default CvDocument;
