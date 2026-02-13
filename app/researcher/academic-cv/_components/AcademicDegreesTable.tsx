"use client";

import { Edit, Trash2, Loader2 } from "lucide-react";
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

export function AcademicDegreesTable({
  degrees,
  onEdit,
  onDelete,
  isPending,
}: AcademicDegreesTableProps) {
  return (
    <div className="overflow-x-auto w-full max-w-full">
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
            <TableHead className="text-center whitespace-nowrap py-4 px-4">تاريخ الإضافة</TableHead>
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
                  <div className="text-sm text-gray-900 truncate">
                    {degree.university}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {degree.country}
                  </div>
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
  );
}
