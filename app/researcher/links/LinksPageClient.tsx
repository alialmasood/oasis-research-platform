"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import {
  Link as LinkIcon,
  Plus,
  ExternalLink,
  Loader2,
  GraduationCap,
  BookOpen,
  Globe,
  FileText,
  User,
  Briefcase,
  Database,
  Stethoscope,
  X,
} from "lucide-react";

export type ResearcherLinksData = {
  googleScholar?: string | null;
  researchGate?: string | null;
  webOfScience?: string | null;
  scopus?: string | null;
  orcid?: string | null;
  linkedIn?: string | null;
  pubmed?: string | null;
  github?: string | null;
  personalWebsite?: string | null;
  otherLinks?: Array<{ label: string; url: string }> | null;
};

type LinkFieldKey = keyof Omit<ResearcherLinksData, "otherLinks">;

type LinkFieldDef = {
  key: LinkFieldKey;
  label: string;
  displayLabel: string;
  placeholder: string;
  icon: React.ElementType;
  group: "academic" | "additional";
};

const LINK_FIELDS: LinkFieldDef[] = [
  {
    key: "googleScholar",
    label: "رابط Google Scholar",
    displayLabel: "Google Scholar",
    placeholder: "https://scholar.google.com/...",
    icon: GraduationCap,
    group: "academic",
  },
  {
    key: "researchGate",
    label: "رابط ResearchGate",
    displayLabel: "ResearchGate",
    placeholder: "https://www.researchgate.net/profile/...",
    icon: BookOpen,
    group: "academic",
  },
  {
    key: "webOfScience",
    label: "رابط Web of Science",
    displayLabel: "Web of Science",
    placeholder: "https://www.webofscience.com/...",
    icon: Globe,
    group: "academic",
  },
  {
    key: "scopus",
    label: "رابط Scopus",
    displayLabel: "Scopus",
    placeholder: "https://www.scopus.com/...",
    icon: FileText,
    group: "academic",
  },
  {
    key: "orcid",
    label: "رابط ORCID",
    displayLabel: "ORCID",
    placeholder: "https://orcid.org/0000-0000-0000-0000",
    icon: User,
    group: "academic",
  },
  {
    key: "linkedIn",
    label: "رابط LinkedIn",
    displayLabel: "LinkedIn",
    placeholder: "https://www.linkedin.com/in/...",
    icon: Briefcase,
    group: "additional",
  },
  {
    key: "pubmed",
    label: "رابط PubMed",
    displayLabel: "PubMed",
    placeholder: "https://pubmed.ncbi.nlm.nih.gov/...",
    icon: Stethoscope,
    group: "additional",
  },
  {
    key: "personalWebsite",
    label: "الموقع الشخصي",
    displayLabel: "الموقع الشخصي",
    placeholder: "https://...",
    icon: Globe,
    group: "additional",
  },
];

const ACADEMIC_FIELDS = LINK_FIELDS.filter((f) => f.group === "academic");
const ADDITIONAL_FIELDS = LINK_FIELDS.filter((f) => f.group === "additional");

const emptyLinks = (): ResearcherLinksData => ({
  googleScholar: null,
  researchGate: null,
  webOfScience: null,
  scopus: null,
  orcid: null,
  linkedIn: null,
  pubmed: null,
  github: null,
  personalWebsite: null,
  otherLinks: null,
});

const cardShell = "rounded-xl border border-slate-200/70 bg-white shadow-sm";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200";
const inputClass = `h-10 rounded-lg border-slate-200 text-sm text-left placeholder:text-slate-400/80 ${focusRing}`;
const thinScroll =
  "[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/40";

function LinkCard({
  title,
  url,
  icon: Icon,
}: {
  title: string;
  url: string;
  icon: React.ElementType;
}) {
  const href = url.startsWith("http") ? url : `https://${url}`;

  return (
    <Card className={`${cardShell} overflow-hidden gap-0 py-0 hover:border-slate-300/80 transition-colors`}>
      <CardContent className="p-0">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={url}
          aria-label={`فتح رابط ${title}`}
          className={`flex items-center gap-3 px-3.5 py-3 text-right hover:bg-slate-50/80 transition-colors ${focusRing}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{title}</p>
            <p className="mt-0.5 text-xs text-slate-500 truncate leading-snug" dir="ltr" title={url}>
              {url}
            </p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
        </a>
      </CardContent>
    </Card>
  );
}

function FieldBlock({
  field,
  value,
  onChange,
}: {
  field: LinkFieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const Icon = field.icon;
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={field.key}
        className="text-sm font-medium text-slate-700 flex items-center gap-2"
      >
        <Icon className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
        {field.label}
      </Label>
      <Input
        id={field.key}
        type="url"
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir="ltr"
        className={inputClass}
      />
    </div>
  );
}

export function LinksPageClient() {
  const [links, setLinks] = useState<ResearcherLinksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ResearcherLinksData>(emptyLinks());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [otherRows, setOtherRows] = useState<Array<{ label: string; url: string }>>([]);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/researcher/links", { credentials: "include" });
      if (!res.ok) {
        setLinks(emptyLinks());
        return;
      }
      const data = await res.json();
      setLinks(data);
    } catch {
      setLinks(emptyLinks());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const openManage = () => {
    setForm(links ?? emptyLinks());
    setOtherRows(
      Array.isArray(links?.otherLinks) && links.otherLinks.length > 0
        ? [...links.otherLinks]
        : [{ label: "", url: "" }]
    );
    setManageOpen(true);
  };

  const closeManage = () => {
    setManageOpen(false);
    setOtherRows([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const otherFiltered = otherRows.filter((r) => r.url?.trim());
      const payload = {
        ...form,
        otherLinks: otherFiltered.length > 0 ? otherFiltered : null,
      };
      const res = await fetch("/api/researcher/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.error ?? "فشل في حفظ الروابط", "error");
        setSaving(false);
        return;
      }
      const data = await res.json();
      setLinks(data);
      showToast("تم حفظ الروابط بنجاح");
      closeManage();
    } catch {
      showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const addOtherRow = () => setOtherRows((prev) => [...prev, { label: "", url: "" }]);
  const updateOtherRow = (i: number, field: "label" | "url", value: string) => {
    setOtherRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };
  const removeOtherRow = (i: number) =>
    setOtherRows((prev) => (prev.length <= 1 ? [{ label: "", url: "" }] : prev.filter((_, idx) => idx !== i)));

  const hasAnyLink =
    links &&
    (LINK_FIELDS.some((f) => links[f.key]) ||
      (Array.isArray(links.otherLinks) && links.otherLinks.some((o) => o.url?.trim())));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-slate-500 gap-2 text-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        جاري تحميل الروابط...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">
            روابط الباحث
          </h1>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-2xl">
            أدخل وعرض الروابط الرسمية لحساباتك البحثية والأكاديمية
          </p>
        </div>
        <Button
          onClick={openManage}
          className={`h-9 rounded-lg px-3.5 text-sm bg-blue-600 hover:bg-blue-700 text-white shrink-0 ${focusRing}`}
        >
          <Plus className="h-3.5 w-3.5 ml-2" />
          إدارة روابط الباحث
        </Button>
      </div>

      {!hasAnyLink ? (
        <Card className={`${cardShell} gap-0 py-0`}>
          <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <LinkIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-[17px] font-semibold text-slate-800">لا توجد روابط مسجّلة</h3>
            <p className="mt-1.5 text-[13px] text-slate-500 max-w-md leading-relaxed">
              أضف روابط حساباتك على Google Scholar و ResearchGate و Scopus وغيرها لعرضها هنا.
            </p>
            <Button
              onClick={openManage}
              className={`mt-5 h-9 rounded-lg px-3.5 text-sm bg-blue-600 hover:bg-blue-700 text-white ${focusRing}`}
            >
              <Plus className="h-3.5 w-3.5 ml-2" />
              إضافة روابط
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {LINK_FIELDS.map(({ key, displayLabel, icon: Icon }) => {
            const url = links?.[key];
            if (!url?.trim()) return null;
            return <LinkCard key={key} title={displayLabel} url={url} icon={Icon} />;
          })}
          {Array.isArray(links?.otherLinks) &&
            links.otherLinks
              .filter((o) => o.url?.trim())
              .map((o, i) => (
                <LinkCard
                  key={`other-${i}`}
                  title={o.label?.trim() || "رابط إضافي"}
                  url={o.url}
                  icon={Database}
                />
              ))}
        </div>
      )}

      <Dialog open={manageOpen} onOpenChange={(open) => !open && closeManage()}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-1.5rem)] sm:max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh] rounded-xl border-slate-200/70 shadow-lg"
          dir="rtl"
        >
          <button
            type="button"
            onClick={closeManage}
            aria-label="إغلاق"
            className={`absolute top-3.5 start-3.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${focusRing}`}
          >
            <X className="h-4 w-4" />
          </button>

          <DialogHeader className="shrink-0 px-5 pt-4 pb-3 border-b border-slate-100 text-right space-y-1 gap-1 ps-14">
            <DialogTitle className="text-[17px] font-semibold text-slate-900">
              إدارة روابط الباحث
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              أدخل الروابط الرسمية للحسابات البحثية، ويمكنك ترك الحقول الفارغة.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className={`flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 ${thinScroll}`}>
              <section className="space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-slate-800">الروابط الأكاديمية</h3>
                  <p className="text-[11px] text-slate-400">
                    الحسابات الأساسية المستخدمة في الفهرسة والاستشهادات.
                  </p>
                </div>
                <div className="space-y-3">
                  {ACADEMIC_FIELDS.map((field) => (
                    <FieldBlock
                      key={field.key}
                      field={field}
                      value={(form[field.key] as string) ?? ""}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, [field.key]: value || null }))
                      }
                    />
                  ))}
                </div>
              </section>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-slate-800">الروابط الإضافية</h3>
                  <p className="text-[11px] text-slate-400">
                    روابط مهنية أو شخصية اختيارية.
                  </p>
                </div>
                <div className="space-y-3">
                  {ADDITIONAL_FIELDS.map((field) => (
                    <FieldBlock
                      key={field.key}
                      field={field}
                      value={(form[field.key] as string) ?? ""}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, [field.key]: value || null }))
                      }
                    />
                  ))}
                </div>

                <div className="space-y-2.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-700">روابط إضافية</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOtherRow}
                      className={`h-8 rounded-lg px-2.5 text-xs border-slate-200 ${focusRing}`}
                    >
                      <Plus className="h-3.5 w-3.5 ml-1" />
                      إضافة
                    </Button>
                  </div>
                  <div className="space-y-2.5">
                    {otherRows.map((row, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row gap-2 sm:items-center rounded-xl border border-slate-200/60 bg-slate-50/40 p-2.5"
                      >
                        <Input
                          placeholder="اسم الرابط"
                          value={row.label}
                          onChange={(e) => updateOtherRow(i, "label", e.target.value)}
                          className={`h-10 rounded-lg border-slate-200 text-sm placeholder:text-slate-400/80 sm:w-[38%] ${focusRing}`}
                          aria-label={`اسم الرابط الإضافي ${i + 1}`}
                        />
                        <Input
                          placeholder="https://..."
                          type="url"
                          value={row.url}
                          onChange={(e) => updateOtherRow(i, "url", e.target.value)}
                          dir="ltr"
                          className={`h-10 rounded-lg border-slate-200 text-sm text-left placeholder:text-slate-400/80 flex-1 ${focusRing}`}
                          aria-label={`رابط إضافي ${i + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOtherRow(i)}
                          className={`h-9 w-9 shrink-0 text-slate-400 hover:text-rose-600 ${focusRing}`}
                          aria-label={`حذف الرابط الإضافي ${i + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 !flex-row !flex-nowrap justify-start gap-2 border-t border-slate-100 px-5 py-3 bg-white sm:justify-start">
              <Button
                type="submit"
                disabled={saving}
                className={`h-9 rounded-lg px-3.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-70 ${focusRing}`}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-2" /> : null}
                حفظ التغييرات
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeManage}
                disabled={saving}
                className={`h-9 rounded-lg px-3.5 text-sm border-slate-200 ${focusRing}`}
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
