"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Calendar, Globe } from "lucide-react";
import type { ProfileCV } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

interface PersonalInfoCardProps {
  profileCv: ProfileCV;
  age: number | null;
}

const genderLabels: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
  OTHER: "آخر",
};

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="text-[11px] font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 leading-snug break-words">{value}</p>
    </div>
  );
}

export function PersonalInfoCard({ profileCv, age }: PersonalInfoCardProps) {
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return "غير محدد";
    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const addressFields = [
    { key: "province", label: "المحافظة", value: profileCv.province },
    { key: "district", label: "القضاء", value: profileCv.district },
    { key: "area", label: "المنطقة", value: profileCv.area },
    { key: "address", label: "التفاصيل", value: profileCv.address },
  ].filter((f) => Boolean(f.value?.trim()));

  const hasIdentity =
    Boolean(profileCv.gender) ||
    Boolean(profileCv.nationality) ||
    Boolean(profileCv.dateOfBirth);
  const hasAddress = addressFields.length > 0;
  const isEmpty = !hasIdentity && !hasAddress;

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm h-full">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <User className="h-4 w-4 text-blue-600" />
          </span>
          معلومات شخصية
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        {isEmpty ? (
          <p className="text-sm text-slate-400 text-center py-6">لا توجد معلومات شخصية</p>
        ) : (
          <>
            {hasIdentity && (
              <section className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500">البيانات الأساسية</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {profileCv.gender && (
                    <InfoTile
                      icon={User}
                      label="الجنس"
                      value={genderLabels[profileCv.gender] || profileCv.gender}
                    />
                  )}
                  {profileCv.nationality && (
                    <InfoTile icon={Globe} label="القومية" value={profileCv.nationality} />
                  )}
                  {profileCv.dateOfBirth && (
                    <InfoTile
                      icon={Calendar}
                      label="تاريخ الميلاد"
                      value={
                        age !== null
                          ? `${formatDate(profileCv.dateOfBirth)} · ${age} سنة`
                          : formatDate(profileCv.dateOfBirth)
                      }
                    />
                  )}
                </div>
              </section>
            )}

            {hasAddress && (
              <section className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500">عنوان السكن</p>
                </div>
                <div
                  className={`rounded-xl border border-slate-100 grid grid-cols-1 divide-y divide-slate-100 overflow-hidden ${
                    addressFields.length >= 2
                      ? "sm:grid-cols-2 sm:divide-y-0 sm:divide-x"
                      : ""
                  }`}
                >
                  {addressFields.map((field) => (
                    <div key={field.key} className="px-3.5 py-3 bg-white">
                      <p className="text-[11px] font-medium text-slate-500 mb-1">{field.label}</p>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
