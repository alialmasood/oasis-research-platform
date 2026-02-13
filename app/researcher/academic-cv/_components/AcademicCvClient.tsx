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

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">السيرة العلمية</h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة الشهادات العلمية والمؤهلات الأكاديمية
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {degrees.length > 0 && (
            <>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 ml-2" />
                تصدير PDF
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير Excel
              </Button>
            </>
          )}
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة شهادة علمية
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
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                الشهادات العلمية
              </CardTitle>
              {/* Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* عدد الشهادات */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs">
                  <Layers className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-slate-700 font-medium">
                    {degrees.length} شهادة
                  </span>
                </div>
                {/* أحدث شهادة */}
                {(() => {
                  const latestDegree = [...degrees].sort(
                    (a, b) => b.graduationYear - a.graduationYear
                  )[0];
                  return latestDegree ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs">
                      <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-slate-700">
                        {latestDegree.graduationYear} - {degreeLabels[latestDegree.degree] || latestDegree.degree}
                      </span>
                    </div>
                  ) : null;
                })()}
                {/* آخر تحديث */}
                {(() => {
                  const latestUpdate = [...degrees].sort((a, b) => {
                    const aDate = new Date(a.updatedAt || a.createdAt).getTime();
                    const bDate = new Date(b.updatedAt || b.createdAt).getTime();
                    return bDate - aDate;
                  })[0];
                  return latestUpdate ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      <span className="text-slate-700">
                        {formatShortDate(latestUpdate.updatedAt || latestUpdate.createdAt)}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AcademicDegreesTable
              degrees={degrees}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* توزيع الشهادات */}
      {degrees.length > 0 && (
        <DegreesDistributionChart degrees={degrees} />
      )}

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
