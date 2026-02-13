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
    <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
      <Button
        type="button"
        variant="outline"
        className="border-slate-200 text-slate-700 hover:bg-slate-50"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4 ml-2" />
        طباعة الاستمارة
      </Button>
      <Button
        type="button"
        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
        onClick={handleExportPDF}
      >
        <FileDown className="h-4 w-4 ml-2" />
        تصدير PDF
      </Button>
    </div>
  );
}
