"use client";

import { Edit, Trash2, Loader2, GraduationCap, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AcademicDegree } from "@prisma/client";

interface AcademicDegreesTableProps {
  degrees: AcademicDegree[];
  onEdit: (degree: AcademicDegree) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

const degreeLabels: Record<string, string> = {
  BACHELORS: "بكالوريوس",
  DIPLOMA: "دبلوم",
  HIGHER_DIPLOMA: "دبلوم عالي",
  MASTERS: "ماجستير",
  PHD: "دكتوراه",
  BOARD: "بورد",
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AcademicDegreesTable({
  degrees,
  onEdit,
  onDelete,
  isPending,
}: AcademicDegreesTableProps) {
  const sorted = [...degrees].sort((a, b) => b.graduationYear - a.graduationYear);

  return (
    <>
      {/* موبايل: بطاقات مضغوطة */}
      <div className="md:hidden space-y-2.5">
        {sorted.map((degree) => (
          <div
            key={degree.id}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="font-semibold text-[11px]">
                    {degreeLabels[degree.degree] || degree.degree}
                  </Badge>
                  <span className="text-xs font-bold tabular-nums text-blue-700">
                    {degree.graduationYear}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 leading-snug">
                  {degree.majorGeneral}
                </p>
                {degree.majorSpecific && (
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {degree.majorSpecific}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(degree)}
                  disabled={isPending}
                  className="h-8 w-8"
                  aria-label="تعديل"
                >
                  <Edit className="h-3.5 w-3.5 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(degree.id)}
                  disabled={isPending}
                  className="h-8 w-8"
                  aria-label="حذف"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 text-red-600 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
              <div className="min-w-0 flex items-start gap-1.5">
                <GraduationCap className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400">الجامعة</p>
                  <p className="text-[11px] font-medium text-slate-800 truncate">
                    {degree.university}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-1.5">
                <MapPin className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400">الدولة</p>
                  <p className="text-[11px] font-medium text-slate-800 truncate">
                    {degree.country}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              أُضيفت: {formatShortDate(degree.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {/* حاسوب: الجدول كما كان */}
      <div className="hidden md:block overflow-x-auto w-full max-w-full">
        <Table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: "120px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "260px" }} />
            <col style={{ width: "260px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "140px" }} />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-slate-50/70 border-b">
              <TableHead className="text-center py-4 px-4">إجراءات</TableHead>
              <TableHead className="text-center whitespace-nowrap py-4 px-4">
                تاريخ الإضافة
              </TableHead>
              <TableHead className="text-right py-4 px-4">الجامعة / الدولة</TableHead>
              <TableHead className="text-right py-4 px-4">الاختصاص</TableHead>
              <TableHead className="text-center whitespace-nowrap py-4 px-4">السنة</TableHead>
              <TableHead className="text-right whitespace-nowrap py-4 px-4">الشهادة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {degrees.map((degree) => (
              <TableRow key={degree.id} className="hover:bg-slate-50">
                <TableCell className="text-center py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(degree)}
                      disabled={isPending}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(degree.id)}
                      disabled={isPending}
                      className="h-8 w-8"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center whitespace-nowrap py-4 px-4 text-sm text-slate-600">
                  {formatDate(degree.createdAt)}
                </TableCell>
                <TableCell className="text-right py-4 px-4">
                  <div className="space-y-0.5">
                    <div className="text-sm text-gray-900 truncate">{degree.university}</div>
                    <div className="text-xs text-slate-500 truncate">{degree.country}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4 px-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {degree.majorGeneral}
                    </div>
                    {degree.majorSpecific && (
                      <div className="text-xs text-slate-500 truncate">
                        {degree.majorSpecific}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center whitespace-nowrap py-4 px-4 font-medium">
                  {degree.graduationYear}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap py-4 px-4">
                  <Badge variant="outline" className="font-medium">
                    {degreeLabels[degree.degree] || degree.degree}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
