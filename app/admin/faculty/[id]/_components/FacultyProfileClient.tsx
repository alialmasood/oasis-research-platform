"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import type { FacultyMemberDetail } from "@/lib/admin/facultyTypes";

interface FacultyProfileClientProps {
  member: FacultyMemberDetail;
}

function InfoRow({ label, value }: { label: string; value: string | null | number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <dt className="text-sm text-slate-500 sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-900 font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export function FacultyProfileClient({ member }: FacultyProfileClientProps) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/faculty"
        className="inline-flex items-center gap-1.5 text-sm text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى سجل التدريسيين
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <AdminPageHeader
          title={member.displayName}
          description="بروفايل التدريسي"
        />
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#2563EB]/20 bg-[#2563EB]/10 sm:mr-auto">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.displayName}
              fill
              className="object-cover"
              unoptimized={
                member.avatarUrl.startsWith("/api/avatar/") ||
                member.avatarUrl.startsWith("/avatars/")
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#2563EB]">
              {member.displayName.slice(0, 2)}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base text-slate-800">المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <dl>
              <InfoRow label="الاسم بالعربية" value={member.fullNameAr} />
              <InfoRow label="الاسم بالإنجليزية" value={member.fullNameEn} />
              <InfoRow label="اللقب العلمي" value={member.academicTitle} />
              <InfoRow label="البريد الجامعي" value={member.email} />
              <InfoRow label="الهاتف" value={member.phone} />
              <InfoRow label="الجنس" value={member.gender} />
              <InfoRow label="تاريخ الميلاد" value={member.dateOfBirth} />
            </dl>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base text-slate-800">الانتماء الأكاديمي والإداري</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <dl>
              <InfoRow label="التشكيل" value={member.entity} />
              <InfoRow label="القسم" value={member.department} />
              <InfoRow label="التخصص العام" value={member.generalSpecialization} />
              <InfoRow label="التخصص الدقيق" value={member.specificSpecialization} />
              <InfoRow label="الرقم الوظيفي" value={member.employeeNumber} />
              <InfoRow label="سنة التعيين" value={member.appointmentYear} />
              <InfoRow label="اكتمال الملف" value={`${member.profileCompletePercent}%`} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-base text-slate-800">
            الشهادات العلمية ({member.degreesCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-0 pb-0">
          {member.degrees.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8 px-4">لا توجد شهادات مسجلة</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e3a8a] hover:bg-[#1e3a8a] border-0">
                    <TableHead className="text-white font-semibold text-right">الشهادة</TableHead>
                    <TableHead className="text-white font-semibold text-center">السنة</TableHead>
                    <TableHead className="text-white font-semibold text-right">الاختصاص</TableHead>
                    <TableHead className="text-white font-semibold text-right">الجامعة / الدولة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.degrees.map((degree) => (
                    <TableRow key={degree.id}>
                      <TableCell className="text-right font-medium">{degree.degreeLabel}</TableCell>
                      <TableCell className="text-center">{degree.graduationYear}</TableCell>
                      <TableCell className="text-right">
                        <div>{degree.majorGeneral}</div>
                        {degree.majorSpecific && (
                          <div className="text-xs text-slate-500">{degree.majorSpecific}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>{degree.university}</div>
                        <div className="text-xs text-slate-500">{degree.country}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
