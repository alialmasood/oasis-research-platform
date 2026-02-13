"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil, Trash2, Download, Copy, Check, MessageCircle } from "lucide-react";
import type { Research } from "@prisma/client";
import { RESEARCH_CATEGORY_LABELS, RESEARCH_STATUS_LABELS } from "@/lib/research/categoryLabels";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-3 gap-y-0.5 py-2 border-b border-slate-100 last:border-b-0 items-baseline">
      <span className="text-xs text-slate-500 truncate">{label}</span>
      <span className="text-sm font-semibold text-slate-900 break-words">{value}</span>
    </div>
  );
}

const statusLabels = RESEARCH_STATUS_LABELS;

const publishStatusLabels: Record<string, string> = {
  DRAFT: "غير منشور",
  PUBLISHED: "منشور",
};

const researchTypeLabels: Record<string, string> = {
  PLANNED: "مخطط",
  UNPLANNED: "غير مخطط",
};

const ownershipLabels: Record<string, string> = {
  INDIVIDUAL: "مفرد",
  TEAM: "مشترك",
  INSTITUTIONAL: "مؤسسي",
};

const publishTypeLabels: Record<string, string> = {
  JOURNAL: "مجلة",
  CONFERENCE: "مؤتمر",
  BOOK_CHAPTER: "فصل كتاب",
  REPORT: "تقرير",
  OTHER: "أخرى",
};

const categoryLabels = RESEARCH_CATEGORY_LABELS;

const months: Record<number, string> = {
  1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل", 5: "مايو", 6: "يونيو",
  7: "يوليو", 8: "أغسطس", 9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(d));
}

interface ResearchDetailsModalProps {
  research: Research | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (research: Research) => void;
  onDelete?: (id: string) => void;
  onCopySuccess?: () => void;
}

export function ResearchDetailsModal({
  research,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCopySuccess,
}: ResearchDetailsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!research) return null;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
      onCopySuccess?.();
    } catch (_) {}
  };

  const handleEdit = () => {
    onClose();
    onEdit?.(research);
  };

  const handleDelete = () => {
    if (typeof onDelete === "function") {
      onDelete(research.id);
    }
  };

  const hasAnyLink = !!research.researchUrl || !!research.downloadUrl;
  const hasDoi = !!research.doi?.trim();

  const shareViaWhatsApp = () => {
    const lines: string[] = [
      `*${research.title}*`,
      `السنة: ${research.year}`,
    ];
    if (hasDoi && research.doi) lines.push(`DOI: ${research.doi}`);
    if (research.researchUrl) lines.push(`رابط البحث: ${research.researchUrl}`);
    const text = lines.join("\n");
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        overlayClassName="bg-black/20"
        className="flex flex-col w-full max-w-[520px] min-w-[420px] sm:min-w-[420px] p-0 gap-0 border-r border-slate-200 rounded-tl-2xl rounded-bl-2xl overflow-hidden"
      >
        <SheetTitle className="sr-only">تفاصيل البحث: {research.title}</SheetTitle>
        {/* (A) Header ثابت */}
        <header className="flex-shrink-0 border-b border-slate-100 bg-white px-5 pt-5 pb-4 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900 line-clamp-2 leading-snug" dir="rtl">
                {research.title}
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline" className="text-xs font-medium text-slate-600">
                  {research.year}
                </Badge>
                <Badge
                  className={
                    research.status === "COMPLETED"
                      ? "bg-green-50 text-green-700 border-green-200 text-xs"
                      : "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                  }
                >
                  {statusLabels[research.status]}
                </Badge>
                {research.status === "COMPLETED" && research.publishStatus && (
                  <Badge
                    className={
                      research.publishStatus === "PUBLISHED"
                        ? "bg-purple-50 text-purple-700 border-purple-200 text-xs"
                        : "bg-amber-50 text-amber-700 border-amber-200 text-xs"
                    }
                  >
                    {publishStatusLabels[research.publishStatus]}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit && (
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* (B) ملخص سريع - Grid Label + Value */}
          <section className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              ملخص سريع
            </h3>
            <div className="space-y-0">
              <DetailRow label="نوع البحث" value={researchTypeLabels[research.researchType]} />
              <DetailRow label="الملكية" value={ownershipLabels[research.ownership]} />
              <div className="py-2 border-b border-slate-100 last:border-b-0">
                <span className="text-xs text-slate-500 block mb-1.5">التصنيفات</span>
                <div className="flex flex-wrap gap-1.5 max-h-[2.75rem] overflow-hidden content-start">
                  {(() => {
                    const all = [
                      ...research.categories.map((cat) => ({ key: cat, label: categoryLabels[cat] ?? cat, outline: true })),
                      ...(research.scopusQuartile ? [{ key: "q", label: research.scopusQuartile, outline: false }] : []),
                    ];
                    const show = all.slice(0, 4);
                    const rest = all.length - show.length;
                    return (
                      <>
                        {show.map((b) =>
                          b.outline ? (
                            <Badge key={b.key} variant="outline" className="text-xs flex-shrink-0">
                              {b.label}
                            </Badge>
                          ) : (
                            <Badge key={b.key} className="bg-orange-50 text-orange-700 border-orange-200 text-xs flex-shrink-0">
                              {b.label}
                            </Badge>
                          )
                        )}
                        {rest > 0 && (
                          <span className="text-xs text-slate-500 self-center">+{rest}</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>

          {/* (C) حالة الإنجاز */}
          <section className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              الإنجاز
            </h3>
            {research.status === "IN_PROGRESS" && research.progressPercent != null ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, research.progressPercent)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums min-w-[3ch]">
                    {research.progressPercent}%
                  </span>
                </div>
                {research.updatedAt && (
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-3 pt-1 items-baseline">
                    <span className="text-xs text-slate-500">آخر تحديث</span>
                    <span className="text-sm font-semibold text-slate-900">{formatDate(research.updatedAt)}</span>
                  </div>
                )}
              </div>
            ) : (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                {statusLabels.COMPLETED}
              </Badge>
            )}
          </section>

          {/* (D) قسم النشر - يظهر فقط إذا البحث منشور؛ إخفاء سطر DOI إذا فارغ */}
          {research.status === "COMPLETED" &&
            research.publishStatus === "PUBLISHED" && (
              <section className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  النشر
                </h3>
                <div className="space-y-0">
                  {research.publishType && (
                    <DetailRow label="نوع النشر" value={publishTypeLabels[research.publishType]} />
                  )}
                  {research.publisher && (
                    <DetailRow label="الناشر" value={research.publisher} />
                  )}
                  {hasDoi && (
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-3 gap-y-0.5 py-2 border-b border-slate-100 items-center">
                      <span className="text-xs text-slate-500">DOI</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 truncate flex-1 min-w-0 text-slate-900 font-medium">
                          {research.doi}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 flex-shrink-0"
                          onClick={() => copyToClipboard(research.doi!, "doi")}
                        >
                          {copied === "doi" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          نسخ
                        </Button>
                      </div>
                    </div>
                  )}
                  {(research.publishMonth || research.year) && (
                    <DetailRow
                      label="التاريخ"
                      value={
                        research.publishMonth
                          ? `${months[research.publishMonth]} ${research.year}`
                          : String(research.year)
                      }
                    />
                  )}
                </div>
              </section>
            )}

          {/* (E) الروابط - إذا لا روابط: "لا توجد روابط"؛ نسخ سريع مع Toast "تم النسخ" */}
          <section className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              إجراءات
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-11 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                onClick={shareViaWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
                مشاركة عبر واتساب
              </Button>
              {!hasAnyLink && (
                <p className="text-xs text-slate-500 py-1">لا توجد روابط</p>
              )}
              {research.researchUrl && (
                <Button variant="outline" className="w-full justify-start gap-2 h-11" asChild>
                  <a href={research.researchUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    فتح رابط البحث
                  </a>
                </Button>
              )}
              {research.downloadUrl && (
                <Button variant="outline" className="w-full justify-start gap-2 h-11" asChild>
                  <a href={research.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    تحميل الملف
                  </a>
                </Button>
              )}
              {hasDoi && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-11"
                  onClick={() => copyToClipboard(research.doi!, "doi")}
                >
                  {copied === "doi" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  نسخ DOI
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-11"
                onClick={() => copyToClipboard(research.title, "title")}
              >
                {copied === "title" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                نسخ عنوان البحث
              </Button>
            </div>
          </section>

          {/* (F) بيانات إضافية - Grid Label + Value */}
          <section className="rounded-xl border border-slate-100 bg-slate-50/30 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              بيانات إضافية
            </h3>
            <div className="space-y-0">
              <DetailRow label="تاريخ الإضافة" value={formatDate(research.createdAt)} />
              <DetailRow label="آخر تعديل" value={formatDate(research.updatedAt)} />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
