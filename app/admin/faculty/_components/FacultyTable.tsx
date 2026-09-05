"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { FacultyAvatarMenu } from "./FacultyAvatarMenu";
import { FacultyDeleteButton } from "./FacultyDeleteButton";
import { FacultyPaginationBar } from "./FacultyPaginationBar";
import type { FacultyListFilters, FacultyMember, FacultyPagination } from "@/lib/admin/facultyTypes";

interface FacultyTableProps {
  faculty: FacultyMember[];
  rowOffset?: number;
  pagination?: FacultyPagination;
  filters?: FacultyListFilters;
}

function CompletionBadge({ percent }: { percent: number }) {
  const cls = "text-[10px] px-1.5 py-0 font-medium";
  if (percent === 100) {
    return (
      <Badge className={cn("bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50", cls)}>
        مكتمل
      </Badge>
    );
  }
  if (percent >= 66) {
    return (
      <Badge className={cn("bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50", cls)}>
        {percent}%
      </Badge>
    );
  }
  return (
    <Badge className={cn("bg-red-50 text-red-700 border-red-200 hover:bg-red-50", cls)}>
      {percent}%
    </Badge>
  );
}

export function FacultyTable({ faculty, rowOffset = 0, pagination, filters }: FacultyTableProps) {
  if (faculty.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        لا يوجد تدريسيون مسجلون في النظام حالياً
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[36px]" />
            <col className="w-[170px]" />
            <col className="w-[88px]" />
            <col className="w-[175px]" />
            <col className="w-[130px]" />
            <col className="w-[105px]" />
            <col className="w-[105px]" />
            <col className="w-[105px]" />
            <col className="w-[82px]" />
            <col className="w-[52px]" />
            <col className="w-[64px]" />
            <col className="w-[52px]" />
            <col className="w-[78px]" />
            <col className="w-[72px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-[#1e3a8a] hover:bg-[#1e3a8a] border-0">
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5">#</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">الاسم</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5 whitespace-nowrap">
                اللقب العلمي
              </TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">البريد الجامعي</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">التشكيل</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">القسم</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">التخصص العام</TableHead>
              <TableHead className="text-white font-semibold text-right px-2 py-2.5">التخصص الدقيق</TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5 whitespace-nowrap">
                أعلى شهادة
              </TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5 whitespace-nowrap">
                الشهادات
              </TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5 whitespace-nowrap">
                سنة التعيين
              </TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5 whitespace-nowrap">
                الجنس
              </TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5 whitespace-nowrap">
                اكتمال الملف
              </TableHead>
              <TableHead className="text-white font-semibold text-center px-1.5 py-2.5 whitespace-nowrap">
                إجراءات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faculty.map((member, index) => (
              <TableRow
                key={member.id}
                className={cn(
                  "border-b border-slate-100 transition-colors",
                  index % 2 === 0 ? "bg-white" : "bg-slate-50/60",
                  "hover:bg-blue-50/40"
                )}
              >
                <TableCell className="text-center text-slate-500 font-medium px-1.5 py-2">
                  {rowOffset + index + 1}
                </TableCell>
                <TableCell className="px-2 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FacultyAvatarMenu member={member} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-xs leading-tight">
                        {member.displayName}
                      </p>
                      {member.fullNameEn && member.fullNameAr && (
                        <p className="text-[10px] text-slate-400 truncate leading-tight" dir="ltr">
                          {member.fullNameEn}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-slate-700 px-2 py-2 whitespace-nowrap">
                  {member.academicTitle || "—"}
                </TableCell>
                <TableCell className="text-right px-2 py-2">
                  <span className="text-slate-700 font-mono truncate block" dir="ltr" title={member.email}>
                    {member.email}
                  </span>
                </TableCell>
                <TableCell className="text-right text-slate-700 px-2 py-2 truncate" title={member.entity ?? undefined}>
                  {member.entity || "—"}
                </TableCell>
                <TableCell className="text-right text-slate-700 px-2 py-2 truncate" title={member.department ?? undefined}>
                  {member.department || "—"}
                </TableCell>
                <TableCell className="text-right text-slate-700 px-2 py-2 truncate" title={member.generalSpecialization ?? undefined}>
                  {member.generalSpecialization || "—"}
                </TableCell>
                <TableCell className="text-right text-slate-700 px-2 py-2 truncate" title={member.specificSpecialization ?? undefined}>
                  {member.specificSpecialization || "—"}
                </TableCell>
                <TableCell className="text-center text-slate-700 px-1.5 py-2 whitespace-nowrap">
                  {member.highestDegree || "—"}
                </TableCell>
                <TableCell className="text-center font-semibold text-slate-800 px-1.5 py-2">
                  {member.degreesCount}
                </TableCell>
                <TableCell className="text-center text-slate-700 px-1.5 py-2">
                  {member.appointmentYear ?? "—"}
                </TableCell>
                <TableCell className="text-center text-slate-700 px-1.5 py-2">
                  {member.gender || "—"}
                </TableCell>
                <TableCell className="text-center px-1.5 py-2">
                  <CompletionBadge percent={member.profileCompletePercent} />
                </TableCell>
                <TableCell className="text-center px-1 py-2">
                  <FacultyDeleteButton memberId={member.id} displayName={member.displayName} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && filters ? (
        <FacultyPaginationBar pagination={pagination} filters={filters} />
      ) : (
        <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <span>جامعة البصرة — سجل أعضاء هيئة التدريس</span>
          <span>إجمالي السجلات: {faculty.length}</span>
        </div>
      )}
    </div>
  );
}
