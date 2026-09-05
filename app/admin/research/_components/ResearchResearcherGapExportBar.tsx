"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportResearcherGapTableExcel,
  exportResearcherGapTablePdf,
} from "@/lib/admin/researcherGapExport";
import type { AdminResearcherGapTable } from "@/lib/admin/researchTypes";

interface ResearchResearcherGapExportBarProps {
  table: AdminResearcherGapTable;
  totalResearchers: number;
  academicYearLabel: string;
}

export function ResearchResearcherGapExportBar({
  table,
  totalResearchers,
  academicYearLabel,
}: ResearchResearcherGapExportBarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const disabled = isExporting || table.members.length === 0;

  const handleExportExcel = () => {
    if (disabled) return;
    setIsExporting(true);
    try {
      exportResearcherGapTableExcel(table, totalResearchers, academicYearLabel);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (disabled) return;
    setIsExporting(true);
    try {
      exportResearcherGapTablePdf(table, totalResearchers, academicYearLabel);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs border-slate-200"
        onClick={handleExportExcel}
        disabled={disabled}
      >
        <FileSpreadsheet className="h-3.5 w-3.5 ml-1" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs border-slate-200"
        onClick={handleExportPdf}
        disabled={disabled}
      >
        <FileText className="h-3.5 w-3.5 ml-1" />
        PDF
      </Button>
    </div>
  );
}
