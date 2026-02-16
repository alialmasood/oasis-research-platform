"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const LINK_FIELDS: Array<{
  key: keyof Omit<ResearcherLinksData, "otherLinks">;
  label: string;
  placeholder: string;
  icon: React.ElementType;
}> = [
  { key: "googleScholar", label: "رابط Google Scholar", placeholder: "https://scholar.google.com/...", icon: GraduationCap },
  { key: "researchGate", label: "رابط Research Gate", placeholder: "https://www.researchgate.net/...", icon: BookOpen },
  { key: "webOfScience", label: "رابط Web of Science", placeholder: "https://www.webofscience.com/...", icon: Globe },
  { key: "scopus", label: "رابط Scopus", placeholder: "https://www.scopus.com/...", icon: FileText },
  { key: "orcid", label: "رابط ORCID", placeholder: "https://orcid.org/...", icon: User },
  { key: "linkedIn", label: "رابط LinkedIn", placeholder: "https://www.linkedin.com/in/...", icon: Briefcase },
  { key: "pubmed", label: "رابط PubMed", placeholder: "https://pubmed.ncbi.nlm.nih.gov/...", icon: Stethoscope },
  { key: "personalWebsite", label: "الموقع الشخصي", placeholder: "https://...", icon: Globe },
];

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

function LinkCard({
  title,
  url,
  icon: Icon,
}: {
  title: string;
  url: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 text-right hover:bg-slate-50 transition-colors"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800">{title}</p>
            <p className="text-xs text-slate-500 truncate">{url}</p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
        </a>
      </CardContent>
    </Card>
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
      <div className="flex items-center justify-center min-h-[280px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">روابط الباحث</h1>
          <p className="text-sm text-slate-500 mt-1">
            أدخل وعرض الروابط الرسمية لحساباتك البحثية والأكاديمية
          </p>
        </div>
        <Button onClick={openManage} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Plus className="h-4 w-4 ml-2" />
          إدارة روابط الباحث
        </Button>
      </div>

      {!hasAnyLink ? (
        <Card className="border border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-blue-50 p-4 mb-4">
              <LinkIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">لا توجد روابط مسجّلة</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md">
              أضف روابط حساباتك على Google Scholar و Research Gate و Scopus وغيرها لعرضها هنا.
            </p>
            <Button onClick={openManage} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 ml-2" />
              إضافة روابط
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LINK_FIELDS.map(({ key, label, icon: Icon }) => {
            const url = links?.[key];
            if (!url?.trim()) return null;
            return (
              <LinkCard key={key} title={label} url={url} icon={Icon} />
            );
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة روابط الباحث</DialogTitle>
            <DialogDescription>
              أدخل الروابط الرسمية لحساباتك البحثية. يمكنك ترك الحقول الفارغة.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            {LINK_FIELDS.map(({ key, label, placeholder, icon: Icon }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-500" />
                  {label}
                </Label>
                <Input
                  id={key}
                  type="url"
                  placeholder={placeholder}
                  value={(form[key] as string) ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value || null }))}
                  className="border-slate-200"
                />
              </div>
            ))}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">روابط إضافية</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOtherRow}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة
                </Button>
              </div>
              {otherRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <Input
                    placeholder="اسم الرابط"
                    value={row.label}
                    onChange={(e) => updateOtherRow(i, "label", e.target.value)}
                    className="flex-1 border-slate-200"
                  />
                  <Input
                    placeholder="الرابط"
                    type="url"
                    value={row.url}
                    onChange={(e) => updateOtherRow(i, "url", e.target.value)}
                    className="flex-1 border-slate-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOtherRow(i)}
                    className="shrink-0 text-slate-500 hover:text-red-600"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeManage}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
