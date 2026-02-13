"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Calendar, Globe } from "lucide-react";
import type { ProfileCV } from "@prisma/client";

interface PersonalInfoCardProps {
  profileCv: ProfileCV;
  age: number | null;
}

const genderLabels: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
  OTHER: "آخر",
};

export function PersonalInfoCard({ profileCv, age }: PersonalInfoCardProps) {
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return "غير محدد";
    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const addressParts = [
    profileCv.province,
    profileCv.district,
    profileCv.area,
    profileCv.address,
  ].filter(Boolean);

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          معلومات شخصية
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!profileCv.gender && !profileCv.nationality && !profileCv.dateOfBirth && addressParts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">لا توجد معلومات شخصية</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profileCv.gender && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 mr-1">الجنس:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {genderLabels[profileCv.gender] || profileCv.gender}
                  </span>
                </div>
              </div>
            )}

            {profileCv.nationality && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 mr-1">القومية:</span>
                  <span className="text-sm font-medium text-gray-900">{profileCv.nationality}</span>
                </div>
              </div>
            )}

            {profileCv.dateOfBirth && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 mr-1">تاريخ الميلاد:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(profileCv.dateOfBirth)}
                    {age !== null && (
                      <span className="text-slate-500 mr-1">({age} سنة)</span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {addressParts.length > 0 && (
              <div className="flex items-center gap-2 md:col-span-2">
                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 mr-1">عنوان السكن:</span>
                  <span className="text-sm font-medium text-gray-900">{addressParts.join(" / ")}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
