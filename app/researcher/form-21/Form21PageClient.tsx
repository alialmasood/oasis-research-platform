"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Form21Input } from "./_components/Form21Input";
import { Form21Print } from "./_components/Form21Print";
import { getDefaultForm21Data, computeForm21 } from "./utils";
import type { Form21Data, Form21Basic } from "./types";
import { saveForm21Submission } from "./actions";
import "./form21-print.css";

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;
const academicYearLabel = `${currentYear} - ${nextYear}`;

interface Form21PageClientProps {
  initialFormData: Form21Data | null;
  researcherBasic: Form21Basic | null;
  /** أعلى شهادة من صفحة الشهادات العلمية (تُعرض للقراءة فقط) */
  initialDegreeFromDb?: string;
}

export function Form21PageClient({
  initialFormData,
  researcherBasic,
  initialDegreeFromDb,
}: Form21PageClientProps) {
  const [formData, setFormData] = useState<Form21Data>(() => {
    const base = initialFormData ?? getDefaultForm21Data();
    if (researcherBasic) {
      return { ...base, basic: { ...base.basic, ...researcherBasic } };
    }
    if (initialDegreeFromDb) {
      return { ...base, basic: { ...base.basic, degree: initialDegreeFromDb } };
    }
    return base;
  });
  const [printMode, setPrintMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const computed = useMemo(() => computeForm21(formData), [formData]);

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(false), 300);
    }, 200);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveForm21Submission({
      year: academicYearLabel,
      axis1Raw: computed.axis1Raw,
      axis2Raw: computed.axis2Raw,
      axis3Raw: computed.axis3Raw,
      axis1Weighted: computed.axis1Weighted,
      axis2Weighted: computed.axis2Weighted,
      axis3Weighted: computed.axis3Weighted,
      strengthScore: formData.strengthScore,
      penaltyScore: computed.penaltyScore,
      finalScore: computed.finalScore,
      finalGrade: computed.finalGrade,
      formData: formData as unknown as Record<string, unknown>,
    });
    setIsSaving(false);
    if (result.error) alert(result.error);
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <link rel="stylesheet" href="/form21-print.css" />
      <div className="max-w-5xl mx-auto px-3 py-4 md:px-4 md:py-8">
        {/* الهيدر موبايل مضغوط */}
        <div className="no-print md:hidden flex items-center gap-2 border-b border-slate-200 pb-3 mb-3">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src="/mohesr21.png"
              alt="شعار وزارة التعليم العالي والبحث العلمي"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div className="min-w-0 flex-1 text-right space-y-0">
            <p className="text-[10px] font-semibold text-slate-800 leading-tight truncate">
              وزارة التعليم العالي والبحث العلمي
            </p>
            <p className="text-[9px] text-slate-600 leading-tight truncate">
              جهاز الإشراف والتقويم العلمي · ضمان الجودة
            </p>
            <p className="text-[9px] text-slate-500 leading-tight">
              رقم الاستمارة: — · الترميز: —
            </p>
          </div>
        </div>

        {/* الهيدر سطح المكتب - دون تغيير */}
        <div className="no-print hidden md:flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6 mb-6">
          <div className="flex-1 min-w-[200px] text-right space-y-0.5">
            <p className="text-sm font-semibold text-slate-800">
              وزارة التعليم العالي والبحث العلمي
            </p>
            <p className="text-sm text-slate-700">جهاز الإشراف والتقويم العلمي</p>
            <p className="text-sm text-slate-700">دائرة ضمان الجودة والاعتماد الأكاديمي</p>
            <p className="text-sm text-slate-700">قسم تقويم الأداء المؤسسي</p>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center px-4">
            <div className="relative w-24 h-24 md:w-28 md:h-28">
              <Image
                src="/mohesr21.png"
                alt="شعار وزارة التعليم العالي والبحث العلمي"
                width={112}
                height={112}
                className="object-contain"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px] text-left space-y-1">
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-800">رقم الاستمارة:</span>
              <span className="mr-2">—</span>
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-800">ترميز الاستمارة:</span>
              <span className="mr-2">—</span>
            </p>
          </div>
        </div>

        <div className="no-print text-center mb-3 md:mb-4">
          <h1 className="text-sm md:text-xl font-bold text-slate-900 leading-snug md:leading-relaxed">
            <span className="md:hidden">
              استمارة (21) — تقييم الأداء{" "}
              <span className="text-[#2563EB]">{academicYearLabel}</span>
            </span>
            <span className="hidden md:inline">
              استمارة رقم (21): تقييم أداء أعضاء الهيئة التدريسية للعام الدراسي (
              <span className="text-[#2563EB]">{academicYearLabel}</span>)
            </span>
          </h1>
        </div>

        {/* زر الطباعة */}
        <div className="no-print mb-4 md:mb-8 flex justify-center">
          <Button
            onClick={handlePrint}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-8 md:h-9 px-3 md:px-4 text-[11px] md:text-sm"
          >
            <span className="md:hidden">🖨 طباعة</span>
            <span className="hidden md:inline">🖨 طباعة الاستمارة الوزارية</span>
          </Button>
        </div>

        {/* وضع الإدخال - يخفى عند الطباعة */}
        {!printMode && (
          <Form21Input
            data={formData}
            computed={computed}
            onChange={setFormData}
            onSave={handleSave}
            isSaving={isSaving}
            researcherBasic={researcherBasic}
            initialDegreeFromDb={initialDegreeFromDb}
          />
        )}

        {/* وضع الطباعة - يظهر عند printMode لمعاينة الطباعة ثم يطبع */}
        {printMode && (
          <div className={printMode ? "block" : "hidden print-only"}>
            <Form21Print
              academicYear={academicYearLabel}
              data={formData}
              computed={computed}
            />
          </div>
        )}
      </div>
    </div>
  );
}
