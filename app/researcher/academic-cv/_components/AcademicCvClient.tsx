"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, GraduationCap, Calendar, Layers, FileText, Download } from "lucide-react";
import { AcademicDegreeDialog } from "./AcademicDegreeDialog";
import { AcademicDegreesTable } from "./AcademicDegreesTable";
import { DegreesDistributionChart } from "./DegreesDistributionChart";
import { EmptyState } from "@/app/researcher/dashboard/_components/EmptyState";
// Toast will be handled via window.location.reload() for now
// In production, use a proper toast library like sonner or react-hot-toast
import { createAcademicDegree, updateAcademicDegree, deleteAcademicDegree } from "../_actions";
import type { AcademicDegree } from "@prisma/client";

interface AcademicCvClientProps {
  initialDegrees: AcademicDegree[];
}

const degreeLabels: Record<string, string> = {
  BACHELORS: "بكالوريوس",
  DIPLOMA: "دبلوم",
  HIGHER_DIPLOMA: "دبلوم عالي",
  MASTERS: "ماجستير",
  PHD: "دكتوراه",
  BOARD: "بورد",
};

function formatShortDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AcademicCvClient({ initialDegrees }: AcademicCvClientProps) {
  const [degrees, setDegrees] = useState(initialDegrees);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDegree, setEditingDegree] = useState<AcademicDegree | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenDialog = (degree?: AcademicDegree) => {
    setEditingDegree(degree || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDegree(null);
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editingDegree
        ? await updateAcademicDegree(editingDegree.id, formData)
        : await createAcademicDegree(formData);

      if (result.success) {
        alert(result.message); // Temporary - replace with proper toast
        handleCloseDialog();
        // Refresh data
        window.location.reload();
      } else {
        alert(result.message); // Temporary - replace with proper toast
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشهادة العلمية؟")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAcademicDegree(id);

      if (result.success) {
        alert(result.message); // Temporary - replace with proper toast
        // Refresh data
        window.location.reload();
      } else {
        alert(result.message); // Temporary - replace with proper toast
      }
    });
  };

  const handleExportPDF = () => {
    // إنشاء محتوى HTML للـ PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>الشهادات العلمية</title>
          <style>
            body {
              font-family: 'Cairo', Arial, sans-serif;
              padding: 20px;
              direction: rtl;
            }
            h1 {
              text-align: center;
              color: #1f2937;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 12px;
              text-align: right;
            }
            th {
              background-color: #f9fafb;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
          </style>
        </head>
        <body>
          <h1>الشهادات العلمية</h1>
          <table>
            <thead>
              <tr>
                <th>الشهادة</th>
                <th>السنة</th>
                <th>الاختصاص</th>
                <th>الاختصاص الدقيق</th>
                <th>الجامعة</th>
                <th>الدولة</th>
                <th>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              ${degrees
                .sort((a, b) => b.graduationYear - a.graduationYear)
                .map(
                  (degree) => `
                <tr>
                  <td>${degreeLabels[degree.degree] || degree.degree}</td>
                  <td>${degree.graduationYear}</td>
                  <td>${degree.majorGeneral}</td>
                  <td>${degree.majorSpecific || "-"}</td>
                  <td>${degree.university}</td>
                  <td>${degree.country}</td>
                  <td>${formatShortDate(degree.createdAt)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportExcel = () => {
    // إنشاء CSV content
    const headers = [
      "الشهادة",
      "السنة",
      "الاختصاص",
      "الاختصاص الدقيق",
      "الجامعة",
      "الدولة",
      "تاريخ الإضافة",
    ];

    const csvRows = [
      headers.join(","),
      ...degrees
        .sort((a, b) => b.graduationYear - a.graduationYear)
        .map((degree) => {
          return [
            `"${degreeLabels[degree.degree] || degree.degree}"`,
            degree.graduationYear,
            `"${degree.majorGeneral}"`,
            `"${degree.majorSpecific || ""}"`,
            `"${degree.university}"`,
            `"${degree.country}"`,
            `"${formatShortDate(degree.createdAt)}"`,
          ].join(",");
        }),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    }); // BOM for Excel UTF-8 support
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `الشهادات_العلمية_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const latestDegree = degrees.length
    ? [...degrees].sort((a, b) => b.graduationYear - a.graduationYear)[0]
    : null;
  const latestUpdate = degrees.length
    ? [...degrees].sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt).getTime();
        return bDate - aDate;
      })[0]
    : null;

  return (
    <div className="space-y-3 md:space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 truncate">
            السيرة العلمية
          </h1>
          <p className="text-[11px] md:text-sm text-slate-500 mt-0.5 md:mt-1 line-clamp-1">
            إدارة الشهادات العلمية والمؤهلات الأكاديمية
          </p>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap shrink-0 w-full md:w-auto">
          {degrees.length > 0 && (
            <>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 md:h-10 px-2.5 md:px-4 text-[11px] md:text-sm flex-1 md:flex-none"
              >
                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                <span className="md:hidden">PDF</span>
                <span className="hidden md:inline">تصدير PDF</span>
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 md:h-10 px-2.5 md:px-4 text-[11px] md:text-sm flex-1 md:flex-none"
              >
                <Download className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                <span className="md:hidden">Excel</span>
                <span className="hidden md:inline">تصدير Excel</span>
              </Button>
            </>
          )}
          <Button
            onClick={() => handleOpenDialog()}
            size="sm"
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-8 md:h-10 px-2.5 md:px-4 text-[11px] md:text-sm flex-1 md:flex-none"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
            <span className="md:hidden">إضافة</span>
            <span className="hidden md:inline">إضافة شهادة علمية</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {degrees.length === 0 ? (
        <EmptyState
          title="لا توجد شهادات علمية"
          description="ابدأ بإضافة أول شهادة علمية لبناء سيرتك العلمية"
          icon={GraduationCap}
          actionLabel="إضافة شهادة علمية"
          onActionClick={() => handleOpenDialog()}
        />
      ) : (
        <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg rounded-xl md:rounded-xl gap-0 overflow-hidden">
          <CardHeader className="p-3 md:p-6 pb-2.5 md:pb-4">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:flex-wrap md:gap-4 md:mb-4">
              <CardTitle className="text-sm md:text-lg font-semibold text-gray-900">
                الشهادات العلمية
              </CardTitle>
              <div className="grid grid-cols-3 md:flex md:items-center gap-1.5 md:gap-2">
                <div className="inline-flex items-center justify-center md:justify-start gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg md:rounded-full border border-slate-200 bg-slate-50 md:bg-white/70 text-[10px] md:text-xs min-w-0">
                  <Layers className="h-3 w-3 md:h-3.5 md:w-3.5 text-slate-600 shrink-0" />
                  <span className="text-slate-700 font-medium truncate">
                    {degrees.length} شهادة
                  </span>
                </div>
                {latestDegree && (
                  <div className="inline-flex items-center justify-center md:justify-start gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg md:rounded-full border border-slate-200 bg-slate-50 md:bg-white/70 text-[10px] md:text-xs min-w-0">
                    <GraduationCap className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600 shrink-0" />
                    <span className="text-slate-700 truncate">
                      {latestDegree.graduationYear} -{" "}
                      {degreeLabels[latestDegree.degree] || latestDegree.degree}
                    </span>
                  </div>
                )}
                {latestUpdate && (
                  <div className="inline-flex items-center justify-center md:justify-start gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg md:rounded-full border border-slate-200 bg-slate-50 md:bg-white/70 text-[10px] md:text-xs min-w-0">
                    <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 text-slate-600 shrink-0" />
                    <span className="text-slate-700 truncate">
                      {formatShortDate(latestUpdate.updatedAt || latestUpdate.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <AcademicDegreesTable
              degrees={degrees}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      )}

      {degrees.length > 0 && <DegreesDistributionChart degrees={degrees} />}

      {/* Dialog */}
      <AcademicDegreeDialog
        key={editingDegree?.id || "new"}
        isOpen={isDialogOpen}
        onCloseAction={handleCloseDialog}
        onSubmitAction={handleSubmit}
        editingDegree={editingDegree}
        isPending={isPending}
      />
    </div>
  );
}
