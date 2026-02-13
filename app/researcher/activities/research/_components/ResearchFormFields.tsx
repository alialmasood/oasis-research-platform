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
  { value: "SCOPUS", label: "SCOPUS" },
  { value: "ISI", label: "ISI" },
  { value: "LOCAL", label: "محلي" },
  { value: "INTERNATIONAL", label: "دولي" },
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">العنوان *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          required
          placeholder="عنوان البحث"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="researchType">نوع البحث *</Label>
          <Select value={formData.researchType} onValueChange={(v) => onFieldChange("researchType", v)}>
            <SelectTrigger id="researchType">
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

        <div className="space-y-2">
          <Label htmlFor="ownership">الملكية *</Label>
          <Select value={formData.ownership} onValueChange={(v) => onFieldChange("ownership", v)}>
            <SelectTrigger id="ownership">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">الحالة *</Label>
          <Select value={formData.status} onValueChange={(v) => onFieldChange("status", v)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="اختر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_PROGRESS">قيد التنفيذ</SelectItem>
              <SelectItem value="COMPLETED">مكتمل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">السنة *</Label>
          <Select value={formData.year} onValueChange={(v) => onFieldChange("year", v)}>
            <SelectTrigger id="year">
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
        <div className="space-y-2">
          <Label htmlFor="progressPercent">نسبة الإنجاز (0-100) *</Label>
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
          />
        </div>
      )}

      {isCompleted && (
        <>
          <div className="space-y-2">
            <Label htmlFor="publishStatus">حالة النشر *</Label>
            <Select
              value={formData.publishStatus}
              onValueChange={(v) => onFieldChange("publishStatus", v)}
            >
              <SelectTrigger id="publishStatus">
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
              <div className="space-y-2">
                <Label htmlFor="researchUrl">رابط البحث</Label>
                <Input
                  id="researchUrl"
                  name="researchUrl"
                  type="url"
                  value={formData.researchUrl}
                  onChange={(e) => onFieldChange("researchUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publishType">نوع النشر *</Label>
                  <Select
                    value={formData.publishType}
                    onValueChange={(v) => onFieldChange("publishType", v)}
                  >
                    <SelectTrigger id="publishType">
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

                <div className="space-y-2">
                  <Label htmlFor="publisher">الناشر *</Label>
                  <Input
                    id="publisher"
                    name="publisher"
                    value={formData.publisher}
                    onChange={(e) => onFieldChange("publisher", e.target.value)}
                    required
                    placeholder="اسم الناشر"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    name="doi"
                    value={formData.doi}
                    onChange={(e) => onFieldChange("doi", e.target.value)}
                    placeholder="10.xxxx/xxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishMonth">شهر النشر</Label>
                  <Select
                    value={formData.publishMonth}
                    onValueChange={(v) => onFieldChange("publishMonth", v)}
                  >
                    <SelectTrigger id="publishMonth">
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

              <div className="space-y-2">
                <Label htmlFor="downloadUrl">رابط التحميل</Label>
                <Input
                  id="downloadUrl"
                  name="downloadUrl"
                  type="url"
                  value={formData.downloadUrl}
                  onChange={(e) => onFieldChange("downloadUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </>
          )}
        </>
      )}

      {isPublished && (
        <>
          <div className="space-y-2">
            <Label>التصنيفات *</Label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-slate-50"
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
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {hasScopus && (
            <div className="space-y-2">
              <Label htmlFor="scopusQuartile">تصنيف سكوبس (Q1-Q4) *</Label>
              <Select
                value={formData.scopusQuartile}
                onValueChange={(v) => onFieldChange("scopusQuartile", v)}
              >
                <SelectTrigger id="scopusQuartile">
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
