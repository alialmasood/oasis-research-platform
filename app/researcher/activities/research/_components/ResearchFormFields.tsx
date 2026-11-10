"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Research } from "@prisma/client";
import { RESEARCH_CATEGORY_LABELS, ISI_DESCRIPTION, RESEARCH_STATUS_LABELS } from "@/lib/research/categoryLabels";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => 1940 + i).reverse();

const months = [
  { value: 1, label: "يناير" },
  { value: 2, label: "فبراير" },
  { value: 3, label: "مارس" },
  { value: 4, label: "أبريل" },
  { value: 5, label: "مايو" },
  { value: 6, label: "يونيو" },
  { value: 7, label: "يوليو" },
  { value: 8, label: "أغسطس" },
  { value: 9, label: "سبتمبر" },
  { value: 10, label: "أكتوبر" },
  { value: 11, label: "نوفمبر" },
  { value: 12, label: "ديسمبر" },
];

const researchTypeOptions = [
  { value: "PLANNED", label: "مخطط" },
  { value: "UNPLANNED", label: "غير مخطط" },
];

const ownershipOptions = [
  { value: "INDIVIDUAL", label: "فردي" },
  { value: "TEAM", label: "فريق" },
  { value: "INSTITUTIONAL", label: "مؤسسي" },
];

const publishStatusOptions = [
  { value: "DRAFT", label: "غير منشور" },
  { value: "PUBLISHED", label: "منشور" },
];

const publishTypeOptions = [
  { value: "JOURNAL", label: "مجلة" },
  { value: "CONFERENCE", label: "مؤتمر" },
  { value: "BOOK_CHAPTER", label: "فصل كتاب" },
  { value: "REPORT", label: "تقرير" },
  { value: "OTHER", label: "أخرى" },
];

const scopusQuartileOptions = [
  { value: "Q1", label: "Q1" },
  { value: "Q2", label: "Q2" },
  { value: "Q3", label: "Q3" },
  { value: "Q4", label: "Q4" },
];

const categoryOptions = [
  { value: "SCOPUS", label: RESEARCH_CATEGORY_LABELS.SCOPUS },
  { value: "ISI", label: RESEARCH_CATEGORY_LABELS.ISI },
  { value: "LOCAL", label: RESEARCH_CATEGORY_LABELS.LOCAL },
  { value: "INTERNATIONAL", label: RESEARCH_CATEGORY_LABELS.INTERNATIONAL },
];

interface ResearchFormFieldsProps {
  editingResearch: Research | null;
  formData: {
    title: string;
    researchType: string;
    ownership: string;
    status: string;
    progressPercent: string;
    year: string;
    publishStatus: string;
    researchUrl: string;
    publishType: string;
    publisher: string;
    doi: string;
    publishMonth: string;
    downloadUrl: string;
    categories: string[];
    scopusQuartile: string;
  };
  onFieldChange: (field: string, value: string | string[]) => void;
}

export function ResearchFormFields({
  editingResearch,
  formData,
  onFieldChange,
}: ResearchFormFieldsProps) {
  const isInProgress = formData.status === "IN_PROGRESS";
  const isCompleted = formData.status === "COMPLETED";
  const isPublished = formData.publishStatus === "PUBLISHED";
  const hasScopus = formData.categories.includes("SCOPUS");

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="space-y-1.5 md:space-y-2">
        <Label htmlFor="title" className="text-xs md:text-sm">
          العنوان *
        </Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          required
          placeholder="عنوان البحث"
          className="h-9 md:h-10 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:gap-4">
        <div className="space-y-1.5 md:space-y-2 min-w-0">
          <Label htmlFor="researchType" className="text-xs md:text-sm">
            نوع البحث *
          </Label>
          <Select value={formData.researchType} onValueChange={(v) => onFieldChange("researchType", v)}>
            <SelectTrigger id="researchType" className="h-9 md:h-10 text-sm">
              <SelectValue placeholder="اختر نوع البحث" />
            </SelectTrigger>
            <SelectContent>
              {researchTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 md:space-y-2 min-w-0">
          <Label htmlFor="ownership" className="text-xs md:text-sm">
            الملكية *
          </Label>
          <Select value={formData.ownership} onValueChange={(v) => onFieldChange("ownership", v)}>
            <SelectTrigger id="ownership" className="h-9 md:h-10 text-sm">
              <SelectValue placeholder="اختر الملكية" />
            </SelectTrigger>
            <SelectContent>
              {ownershipOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:gap-4">
        <div className="space-y-1.5 md:space-y-2 min-w-0">
          <Label htmlFor="status" className="text-xs md:text-sm">
            الحالة *
          </Label>
          <Select value={formData.status} onValueChange={(v) => onFieldChange("status", v)}>
            <SelectTrigger id="status" className="h-9 md:h-10 text-sm">
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_PROGRESS">{RESEARCH_STATUS_LABELS.IN_PROGRESS}</SelectItem>
              <SelectItem value="COMPLETED">{RESEARCH_STATUS_LABELS.COMPLETED}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 md:space-y-2 min-w-0">
          <Label htmlFor="year" className="text-xs md:text-sm">
            السنة *
          </Label>
          <Select value={formData.year} onValueChange={(v) => onFieldChange("year", v)}>
            <SelectTrigger id="year" className="h-9 md:h-10 text-sm">
              <SelectValue placeholder="اختر السنة" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isInProgress && (
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="progressPercent" className="text-xs md:text-sm">
            نسبة الإنجاز (0-100) *
          </Label>
          <Input
            id="progressPercent"
            name="progressPercent"
            type="number"
            min="0"
            max="100"
            value={formData.progressPercent}
            onChange={(e) => onFieldChange("progressPercent", e.target.value)}
            required
            placeholder="مثال: 75"
            className="h-9 md:h-10 text-sm"
          />
        </div>
      )}

      {isCompleted && (
        <>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="publishStatus" className="text-xs md:text-sm">
              حالة النشر *
            </Label>
            <Select
              value={formData.publishStatus}
              onValueChange={(v) => onFieldChange("publishStatus", v)}
            >
              <SelectTrigger id="publishStatus" className="h-9 md:h-10 text-sm">
                <SelectValue placeholder="اختر حالة النشر" />
              </SelectTrigger>
              <SelectContent>
                {publishStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isPublished && (
            <>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="researchUrl" className="text-xs md:text-sm">
                  رابط البحث
                </Label>
                <Input
                  id="researchUrl"
                  name="researchUrl"
                  type="url"
                  value={formData.researchUrl}
                  onChange={(e) => onFieldChange("researchUrl", e.target.value)}
                  placeholder="https://..."
                  className="h-9 md:h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                <div className="space-y-1.5 md:space-y-2 min-w-0">
                  <Label htmlFor="publishType" className="text-xs md:text-sm">
                    نوع النشر *
                  </Label>
                  <Select
                    value={formData.publishType}
                    onValueChange={(v) => onFieldChange("publishType", v)}
                  >
                    <SelectTrigger id="publishType" className="h-9 md:h-10 text-sm">
                      <SelectValue placeholder="اختر نوع النشر" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:space-y-2 min-w-0">
                  <Label htmlFor="publisher" className="text-xs md:text-sm">
                    الناشر *
                  </Label>
                  <Input
                    id="publisher"
                    name="publisher"
                    value={formData.publisher}
                    onChange={(e) => onFieldChange("publisher", e.target.value)}
                    required
                    placeholder="اسم الناشر"
                    className="h-9 md:h-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                <div className="space-y-1.5 md:space-y-2 min-w-0">
                  <Label htmlFor="doi" className="text-xs md:text-sm">
                    DOI
                  </Label>
                  <Input
                    id="doi"
                    name="doi"
                    value={formData.doi}
                    onChange={(e) => onFieldChange("doi", e.target.value)}
                    placeholder="10.xxxx/xxxx"
                    className="h-9 md:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2 min-w-0">
                  <Label htmlFor="publishMonth" className="text-xs md:text-sm">
                    شهر النشر
                  </Label>
                  <Select
                    value={formData.publishMonth}
                    onValueChange={(v) => onFieldChange("publishMonth", v)}
                  >
                    <SelectTrigger id="publishMonth" className="h-9 md:h-10 text-sm">
                      <SelectValue placeholder="اختر الشهر" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="downloadUrl" className="text-xs md:text-sm">
                  رابط التحميل
                </Label>
                <Input
                  id="downloadUrl"
                  name="downloadUrl"
                  type="url"
                  value={formData.downloadUrl}
                  onChange={(e) => onFieldChange("downloadUrl", e.target.value)}
                  placeholder="https://..."
                  className="h-9 md:h-10 text-sm"
                />
              </div>
            </>
          )}
        </>
      )}

      {isPublished && (
        <>
          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-xs md:text-sm">التصنيفات *</Label>
            <p className="text-[10px] md:text-xs text-slate-500">{ISI_DESCRIPTION}</p>
            <div className="grid grid-cols-2 gap-1.5 md:flex md:flex-wrap md:gap-2">
              {categoryOptions.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 border rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(cat.value)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...formData.categories, cat.value]
                        : formData.categories.filter((c) => c !== cat.value);
                      onFieldChange("categories", newCategories);
                    }}
                    className="w-3.5 h-3.5 md:w-4 md:h-4"
                  />
                  <span className="text-[11px] md:text-sm truncate">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {hasScopus && (
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="scopusQuartile" className="text-xs md:text-sm">
                تصنيف سكوبس (Q1-Q4) *
              </Label>
              <Select
                value={formData.scopusQuartile}
                onValueChange={(v) => onFieldChange("scopusQuartile", v)}
              >
                <SelectTrigger id="scopusQuartile" className="h-9 md:h-10 text-sm">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {scopusQuartileOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
