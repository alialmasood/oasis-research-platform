"use client";

import { Button } from "@/components/ui/button";
import { Printer, FileDown } from "lucide-react";

export function Form21Actions() {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
    // في نافذة الطباعة اختر «الحفظ كـ PDF» أو «Save as PDF» كوجهة للطباعة
  };

  return (
    <div className="flex flex-nowrap md:flex-wrap items-center justify-center gap-1.5 md:gap-3 print:hidden">
      <Button
        type="button"
        variant="outline"
        className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 md:h-9 px-2.5 md:px-3 text-[11px] md:text-sm"
        onClick={handlePrint}
      >
        <Printer className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
        <span className="md:hidden">طباعة</span>
        <span className="hidden md:inline">طباعة الاستمارة</span>
      </Button>
      <Button
        type="button"
        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-8 md:h-9 px-2.5 md:px-3 text-[11px] md:text-sm"
        onClick={handleExportPDF}
      >
        <FileDown className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
        <span className="md:hidden">PDF</span>
        <span className="hidden md:inline">تصدير PDF</span>
      </Button>
    </div>
  );
}
