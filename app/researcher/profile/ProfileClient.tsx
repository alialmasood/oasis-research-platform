"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, CheckCircle2, AlertCircle, Building2, ImagePlus, Trash2, Save, X } from "lucide-react";
import Image from "next/image";
import type { ProfileData, BasicInfoForm, AcademicAffiliationForm } from "./actions";
import { uploadAvatar, removeAvatar, updateBasicInfo, updateAcademicAffiliation } from "./actions";
import { ENTITIES, DEPARTMENTS_BY_ENTITY } from "@/lib/entities";

const ACADEMIC_TITLES = ["أستاذ", "أستاذ مساعد", "مدرس", "مدرس مساعد"];

const emptyBasicForm: BasicInfoForm = {
  fullNameAr: "",
  fullNameEn: "",
  academicTitle: "",
  phone: "",
  employeeNumber: "",
  appointmentYear: "",
};

export function ProfileClient({ initialData }: { initialData: ProfileData }) {
  const [profile, setProfile] = useState(initialData);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.profile.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState<BasicInfoForm>(emptyBasicForm);
  const [basicInfoSaving, setBasicInfoSaving] = useState(false);
  const [basicInfoError, setBasicInfoError] = useState<string | null>(null);
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [academicForm, setAcademicForm] = useState<AcademicAffiliationForm>({
    entity: "",
    department: "",
    generalSpecialization: "",
    specificSpecialization: "",
  });
  const [academicSaving, setAcademicSaving] = useState(false);
  const [academicError, setAcademicError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBasicInfoComplete = !!(
    (profile.user.fullNameAr || profile.user.fullNameEn) &&
    profile.user.academicTitle &&
    profile.user.phone
  );

  const isAcademicComplete =
    !!(
      profile.user.entity &&
      (profile.user.department || (DEPARTMENTS_BY_ENTITY[profile.user.entity] ?? []).length === 0) &&
      profile.user.generalSpecialization &&
      profile.user.specificSpecialization
    );

  const isAdminInfoComplete = !!profile.user.appointmentYear;

  const completionItems = [
    { label: "المعلومات الأساسية", shortLabel: "أساسي", completed: isBasicInfoComplete },
    { label: "الانتماء الأكاديمي", shortLabel: "انتماء", completed: isAcademicComplete },
    { label: "المعلومات الإدارية", shortLabel: "إداري", completed: isAdminInfoComplete },
  ];

  const completionPercent = Math.round(
    (completionItems.filter((item) => item.completed).length / completionItems.length) * 100
  );

  const displayName =
    profile.user.fullNameAr || profile.user.fullNameEn || "—";
  const nameForInitials = profile.user.fullNameAr || profile.user.fullNameEn || "";
  const initials = nameForInitials
    ? nameForInitials
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "—";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("avatar", file);
    const result = await uploadAvatar(formData);
    setUploading(false);
    if (result.error) {
      setAvatarError(result.error);
      return;
    }
    if (result.url) {
      setAvatarUrl(result.url + "?t=" + Date.now());
    }
    e.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(null);
    setUploading(true);
    const result = await removeAvatar();
    setUploading(false);
    if (result.error) {
      setAvatarError(result.error);
      return;
    }
    setAvatarUrl(null);
  };

  const openFileInput = () => fileInputRef.current?.click();

  const startEditingBasicInfo = () => {
    setBasicInfoError(null);
    setBasicInfoForm({
      fullNameAr: profile.user.fullNameAr ?? "",
      fullNameEn: profile.user.fullNameEn ?? "",
      academicTitle: profile.user.academicTitle ?? "",
      phone: profile.user.phone ?? "",
      employeeNumber: profile.user.employeeNumber ?? "",
      appointmentYear: profile.user.appointmentYear?.toString() ?? "",
    });
    setIsEditingBasicInfo(true);
  };

  const cancelEditingBasicInfo = () => {
    setIsEditingBasicInfo(false);
    setBasicInfoError(null);
  };

  const saveBasicInfo = async () => {
    setBasicInfoError(null);
    setBasicInfoSaving(true);
    const result = await updateBasicInfo(basicInfoForm);
    setBasicInfoSaving(false);
    if (result.error) {
      setBasicInfoError(result.error);
      return;
    }
    setProfile((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        academicTitle: basicInfoForm.academicTitle || null,
        phone: basicInfoForm.phone || null,
        employeeNumber: basicInfoForm.employeeNumber || null,
        appointmentYear: basicInfoForm.appointmentYear
          ? parseInt(basicInfoForm.appointmentYear, 10)
          : null,
      },
    }));
    setIsEditingBasicInfo(false);
  };

  const startEditingAcademic = () => {
    setAcademicError(null);
    const depts = DEPARTMENTS_BY_ENTITY[profile.user.entity ?? ""] ?? [];
    const noDepts = depts.length === 0;
    setAcademicForm({
      entity: profile.user.entity ?? "",
      department: noDepts ? "لا توجد أقسام" : (profile.user.department ?? ""),
      generalSpecialization: profile.user.generalSpecialization ?? "",
      specificSpecialization: profile.user.specificSpecialization ?? "",
    });
    setIsEditingAcademic(true);
  };

  const cancelEditingAcademic = () => {
    setIsEditingAcademic(false);
    setAcademicError(null);
  };

  const saveAcademic = async () => {
    setAcademicError(null);
    setAcademicSaving(true);
    const result = await updateAcademicAffiliation(academicForm);
    setAcademicSaving(false);
    if (result.error) {
      setAcademicError(result.error);
      return;
    }
    setProfile((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        entity: academicForm.entity || null,
        department:
          academicForm.department && academicForm.department !== "لا توجد أقسام"
            ? academicForm.department
            : null,
        generalSpecialization: academicForm.generalSpecialization || null,
        specificSpecialization: academicForm.specificSpecialization || null,
      },
    }));
    setIsEditingAcademic(false);
  };

  const academicDepts = DEPARTMENTS_BY_ENTITY[academicForm.entity] ?? [];
  const academicHasNoDepts = academicDepts.length === 0;

  const isProfileComplete = completionPercent === 100;
  const statusBadge = isProfileComplete
    ? {
        label: "مكتمل",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      }
    : {
        label: `قيد الإكمال · ${completionPercent}%`,
        className: "bg-amber-50 text-amber-800 border-amber-200",
      };

  const labelClass = "text-[11px] md:text-xs font-medium text-slate-500";
  const readonlyInputClass =
    "h-9 md:h-10 text-sm md:text-sm bg-slate-50 border-slate-200 text-slate-800 w-full min-w-0";
  const editInputClass = "h-9 md:h-10 text-sm w-full min-w-0";
  const cardClass =
    "border-slate-200/80 bg-white shadow-sm rounded-xl gap-0 overflow-hidden";
  const sectionHeaderClass =
    "flex flex-row items-center justify-between gap-2 md:gap-3 space-y-0 border-b border-slate-100 pb-2.5 md:pb-3";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 md:space-y-5 min-w-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* هوية الباحث */}
      <Card className={`${cardClass} bg-gradient-to-b from-blue-50/70 via-white to-white md:bg-white md:bg-none`}>
        <CardContent className="p-3 md:p-5">
          {/* موبايل */}
          <div className="md:hidden space-y-3">
            <div className="flex items-start gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    aria-label="الصورة الشخصية - رفع أو تغيير أو إزالة"
                  >
                    {avatarUrl ? (
                      <div className="h-[4.5rem] w-[4.5rem] rounded-full overflow-hidden">
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={72}
                          height={72}
                          className="h-full w-full object-cover"
                          unoptimized={avatarUrl.startsWith("/avatars/") || avatarUrl.startsWith("/api/avatar/")}
                        />
                      </div>
                    ) : (
                      <div className="h-[4.5rem] w-[4.5rem] rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-700">{initials}</span>
                      </div>
                    )}
                    {uploading && (
                      <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-xs">
                        ...
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem onClick={openFileInput} disabled={uploading}>
                    <ImagePlus className="h-4 w-4 ml-2" />
                    {avatarUrl ? "تغيير الصورة" : "رفع صورة"}
                  </DropdownMenuItem>
                  {avatarUrl && (
                    <DropdownMenuItem
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      إزالة الصورة
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                <h1 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {displayName}
                </h1>
                <p className="text-xs font-semibold text-blue-700">
                  {profile.user.academicTitle || "—"}
                </p>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {profile.user.department && (
                    <span className="inline-flex max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                      {profile.user.department}
                    </span>
                  )}
                  {profile.user.entity && (
                    <span className="inline-flex max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                      {profile.user.entity}
                    </span>
                  )}
                  <span className="inline-flex rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 font-medium">
                    جامعة البصرة
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  className={`h-7 px-2.5 text-[10px] font-medium border flex items-center gap-1 shrink-0 ${statusBadge.className}`}
                >
                  {isProfileComplete ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {isProfileComplete ? "مكتمل" : "قيد الإكمال"}
                </Badge>
                <span className="text-lg font-black tabular-nums text-blue-600 leading-none">
                  {completionPercent}%
                </span>
              </div>
              <Progress value={completionPercent} className="h-2.5" />
              <div className="grid grid-cols-3 gap-1.5">
                {completionItems.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg px-1.5 py-1.5 text-center border flex flex-col items-center gap-0.5 ${
                      item.completed
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-amber-50/70 border-amber-100"
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                    )}
                    <p
                      className={`text-[10px] font-medium leading-none ${
                        item.completed ? "text-emerald-800" : "text-amber-800"
                      }`}
                    >
                      {item.shortLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* حاسوب */}
          <div className="hidden md:flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative flex-shrink-0 rounded-full overflow-hidden ring-2 ring-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    aria-label="الصورة الشخصية - رفع أو تغيير أو إزالة"
                  >
                    {avatarUrl ? (
                      <div className="h-[72px] w-[72px] rounded-full overflow-hidden">
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={72}
                          height={72}
                          className="h-full w-full object-cover"
                          unoptimized={avatarUrl.startsWith("/avatars/") || avatarUrl.startsWith("/api/avatar/")}
                        />
                      </div>
                    ) : (
                      <div className="h-[72px] w-[72px] rounded-full bg-blue-50 flex items-center justify-center">
                        <span className="text-xl font-semibold text-blue-700">{initials}</span>
                      </div>
                    )}
                    {uploading && (
                      <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-xs">
                        ...
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem onClick={openFileInput} disabled={uploading}>
                    <ImagePlus className="h-4 w-4 ml-2" />
                    {avatarUrl ? "تغيير الصورة" : "رفع صورة"}
                  </DropdownMenuItem>
                  {avatarUrl && (
                    <DropdownMenuItem
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      إزالة الصورة
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 min-w-0 space-y-1">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight truncate">
                  {displayName}
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  {profile.user.academicTitle || "—"}
                </p>
                <p className="text-sm text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  {profile.user.department && <span>{profile.user.department}</span>}
                  {profile.user.department && profile.user.entity && (
                    <span className="text-slate-300">|</span>
                  )}
                  {profile.user.entity && <span>{profile.user.entity}</span>}
                  {(profile.user.department || profile.user.entity) && (
                    <span className="text-slate-300">|</span>
                  )}
                  <span>جامعة البصرة</span>
                </p>
              </div>
            </div>

            <Badge
              className={`h-8 px-3 text-xs font-medium border flex items-center gap-1.5 ${statusBadge.className}`}
            >
              {isProfileComplete ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {statusBadge.label}
            </Badge>
          </div>
          {avatarError && (
            <p className="text-sm text-red-600 mt-3">{avatarError}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-5 items-start">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-8 space-y-3 md:space-y-5 min-w-0">
          {/* المعلومات الأساسية */}
          <Card className={cardClass}>
            <CardHeader className={`px-3 md:px-5 pt-3 md:pt-5 ${sectionHeaderClass}`}>
              <CardTitle className="text-sm md:text-base font-semibold text-slate-900 min-w-0">
                المعلومات الأساسية
              </CardTitle>
              {!isEditingBasicInfo ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 border-slate-200 text-slate-700 px-2.5 md:px-3 text-xs"
                  onClick={startEditingBasicInfo}
                >
                  <Edit className="h-3.5 w-3.5 ml-1 md:ml-1.5" />
                  <span className="md:hidden">تعديل</span>
                  <span className="hidden md:inline">تعديل البيانات</span>
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="h-8 px-2.5 md:px-3 text-xs"
                    onClick={saveBasicInfo}
                    disabled={basicInfoSaving}
                  >
                    <Save className="h-3.5 w-3.5 ml-1" />
                    {basicInfoSaving ? "..." : "حفظ"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 md:px-3 text-xs"
                    onClick={cancelEditingBasicInfo}
                    disabled={basicInfoSaving}
                  >
                    <X className="h-3.5 w-3.5 ml-1" />
                    إلغاء
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-3 md:px-5 py-3 md:py-4 space-y-3.5 md:space-y-5">
              {basicInfoError && (
                <p className="text-sm text-red-600">{basicInfoError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 md:gap-x-4 gap-y-2.5 md:gap-y-3.5">
                <div className="space-y-1 md:space-y-1.5 min-w-0">
                  <Label className={labelClass}>الاسم الثلاثي (عربي)</Label>
                  <Input
                    value={profile.user.fullNameAr ?? displayName}
                    readOnly
                    className={readonlyInputClass}
                  />
                </div>
                <div className="space-y-1 md:space-y-1.5 min-w-0">
                  <Label className={labelClass}>الاسم الثلاثي (إنجليزي)</Label>
                  <Input
                    value={profile.user.fullNameEn ?? ""}
                    readOnly
                    className={readonlyInputClass}
                  />
                </div>
                <div className="space-y-1 md:space-y-1.5 min-w-0">
                  <Label className={labelClass}>اللقب العلمي</Label>
                  {isEditingBasicInfo ? (
                    <Select
                      value={basicInfoForm.academicTitle || ""}
                      onValueChange={(value) =>
                        setBasicInfoForm((f) => ({ ...f, academicTitle: value }))
                      }
                    >
                      <SelectTrigger className={editInputClass}>
                        <SelectValue placeholder="اختر اللقب العلمي" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACADEMIC_TITLES.map((title) => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={profile.user.academicTitle ?? ""}
                      readOnly
                      className={readonlyInputClass}
                    />
                  )}
                </div>
                <div className="space-y-1 md:space-y-1.5 min-w-0">
                  <Label className={labelClass}>البريد الجامعي</Label>
                  <Input
                    value={profile.user.email}
                    readOnly
                    title={profile.user.email}
                    className={`${readonlyInputClass} text-[11px] md:text-sm tracking-tight overflow-x-auto`}
                    dir="ltr"
                  />
                </div>

                {/* موبايل: الهاتف ثم الجنس + الميلاد بنفس السطر. حاسوب: 3 أعمدة كما كانت */}
                <div className="sm:col-span-2 space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-3.5">
                  <div className="space-y-1 md:space-y-1.5 min-w-0">
                    <Label className={labelClass}>رقم الهاتف</Label>
                    <Input
                      value={isEditingBasicInfo ? basicInfoForm.phone : (profile.user.phone ?? "")}
                      readOnly={!isEditingBasicInfo}
                      onChange={(e) =>
                        isEditingBasicInfo &&
                        setBasicInfoForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className={isEditingBasicInfo ? editInputClass : readonlyInputClass}
                      dir="ltr"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:contents">
                    <div className="space-y-1 md:space-y-1.5 min-w-0">
                      <Label className={labelClass}>الجنس</Label>
                      <Input
                        value={profile.cvPersonal.gender ?? ""}
                        readOnly
                        className={readonlyInputClass}
                        placeholder="من السيرة الذاتية"
                      />
                    </div>
                    <div className="space-y-1 md:space-y-1.5 min-w-0">
                      <Label className={labelClass}>تاريخ الميلاد</Label>
                      <Input
                        value={
                          profile.cvPersonal.dateOfBirth
                            ? new Date(profile.cvPersonal.dateOfBirth).toISOString().slice(0, 10)
                            : ""
                        }
                        readOnly
                        className={readonlyInputClass}
                        placeholder="من السيرة الذاتية"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 md:pt-4 space-y-2 md:space-y-3">
                <p className="text-[11px] md:text-xs font-semibold text-slate-500 tracking-wide">
                  المعلومات الإدارية
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 md:gap-x-4 gap-y-3 md:gap-y-3.5">
                  <div className="space-y-1 md:space-y-1.5 min-w-0">
                    <Label className={labelClass}>سنة التعيين</Label>
                    <Input
                      value={
                        isEditingBasicInfo
                          ? basicInfoForm.appointmentYear
                          : (profile.user.appointmentYear?.toString() ?? "")
                      }
                      readOnly={!isEditingBasicInfo}
                      onChange={(e) =>
                        isEditingBasicInfo &&
                        setBasicInfoForm((f) => ({ ...f, appointmentYear: e.target.value }))
                      }
                      placeholder="مثال: 2020"
                      className={isEditingBasicInfo ? editInputClass : readonlyInputClass}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الانتماء الأكاديمي */}
          <Card className={cardClass}>
            <CardHeader className={`px-3 md:px-5 pt-3 md:pt-5 ${sectionHeaderClass}`}>
              <CardTitle className="text-sm md:text-base font-semibold text-slate-900 min-w-0">
                الانتماء الأكاديمي
              </CardTitle>
              {!isEditingAcademic ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 border-slate-200 text-slate-700 px-2.5 md:px-3 text-xs"
                  onClick={startEditingAcademic}
                >
                  <Edit className="h-3.5 w-3.5 ml-1 md:ml-1.5" />
                  <span className="md:hidden">{isAcademicComplete ? "تحديث" : "إكمال"}</span>
                  <span className="hidden md:inline">
                    {isAcademicComplete ? "تحديث البيانات" : "إكمال البيانات"}
                  </span>
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="h-8 px-2.5 md:px-3 text-xs"
                    onClick={saveAcademic}
                    disabled={academicSaving}
                  >
                    <Save className="h-3.5 w-3.5 ml-1" />
                    {academicSaving ? "..." : "حفظ"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 md:px-3 text-xs"
                    onClick={cancelEditingAcademic}
                    disabled={academicSaving}
                  >
                    <X className="h-3.5 w-3.5 ml-1" />
                    إلغاء
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-3 md:px-5 py-3 md:py-4">
              {academicError && (
                <p className="text-sm text-red-600 mb-3">{academicError}</p>
              )}

              {/* موبايل: مجموعات أوضح. حاسوب من sm: شبكة عمودين كما كانت */}
              <div className="space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3.5">
                {/* الجامعة + الكلية بنفس السطر على الموبايل */}
                <div className="grid grid-cols-2 gap-2.5 sm:contents rounded-xl sm:rounded-none border border-slate-200/80 sm:border-0 bg-slate-50/60 sm:bg-transparent p-2.5 sm:p-0">
                  <div className="space-y-1 md:space-y-1.5 min-w-0">
                    <Label className={`${labelClass} flex items-center gap-1`}>
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      الجامعة
                    </Label>
                    <Input value="جامعة البصرة" readOnly className={readonlyInputClass} />
                  </div>
                  <div className="space-y-1 md:space-y-1.5 min-w-0">
                    <Label className={`${labelClass} flex items-center gap-1`}>
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="sm:hidden">الكلية</span>
                      <span className="hidden sm:inline">الكلية / التشكيل</span>
                    </Label>
                    {isEditingAcademic ? (
                      <Select
                        value={academicForm.entity || ""}
                        onValueChange={(value) => {
                          const depts = DEPARTMENTS_BY_ENTITY[value] ?? [];
                          const noDepts = depts.length === 0;
                          setAcademicForm((f) => ({
                            ...f,
                            entity: value,
                            department: noDepts ? "لا توجد أقسام" : "",
                          }));
                        }}
                      >
                        <SelectTrigger className={editInputClass}>
                          <SelectValue placeholder="اختر الكلية/التشكيل" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITIES.map((entity) => (
                            <SelectItem key={entity} value={entity}>
                              {entity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={profile.user.entity || ""}
                        readOnly
                        className={readonlyInputClass}
                      />
                    )}
                  </div>
                </div>

                {/* القسم بعرض كامل على الموبايل */}
                <div className="rounded-xl sm:rounded-none border border-slate-200/80 sm:border-0 bg-slate-50/60 sm:bg-transparent p-2.5 sm:p-0 space-y-1 md:space-y-1.5 min-w-0">
                  <Label className={`${labelClass} flex items-center gap-1`}>
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    القسم
                  </Label>
                  {isEditingAcademic ? (
                    academicHasNoDepts ? (
                      <Input
                        value="لا توجد أقسام"
                        readOnly
                        className={readonlyInputClass}
                      />
                    ) : (
                      <Select
                        value={academicForm.department || ""}
                        onValueChange={(value) =>
                          setAcademicForm((f) => ({ ...f, department: value }))
                        }
                      >
                        <SelectTrigger className={editInputClass}>
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicDepts.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  ) : (
                    <Input
                      value={profile.user.department || ""}
                      readOnly
                      className={readonlyInputClass}
                    />
                  )}
                </div>

                {/* التخصص العام — عمود مستقل على الحاسوب */}
                <div className="hidden sm:block space-y-1.5 min-w-0">
                  <Label className={labelClass}>التخصص العام</Label>
                  <Input
                    value={
                      isEditingAcademic
                        ? academicForm.generalSpecialization
                        : (profile.user.generalSpecialization ?? "")
                    }
                    readOnly={!isEditingAcademic}
                    onChange={(e) =>
                      isEditingAcademic &&
                      setAcademicForm((f) => ({
                        ...f,
                        generalSpecialization: e.target.value,
                      }))
                    }
                    placeholder="يتم ملؤه من التدريسي"
                    className={isEditingAcademic ? editInputClass : readonlyInputClass}
                  />
                </div>

                {/* الموبايل: التخصص العام + الدقيق معاً */}
                <div className="sm:hidden rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 space-y-2.5">
                  <div className="space-y-1 min-w-0">
                    <Label className={labelClass}>التخصص العام</Label>
                    <Input
                      value={
                        isEditingAcademic
                          ? academicForm.generalSpecialization
                          : (profile.user.generalSpecialization ?? "")
                      }
                      readOnly={!isEditingAcademic}
                      onChange={(e) =>
                        isEditingAcademic &&
                        setAcademicForm((f) => ({
                          ...f,
                          generalSpecialization: e.target.value,
                        }))
                      }
                      placeholder="يتم ملؤه من التدريسي"
                      className={isEditingAcademic ? editInputClass : readonlyInputClass}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <Label className={labelClass}>التخصص الدقيق</Label>
                    <Input
                      value={
                        isEditingAcademic
                          ? academicForm.specificSpecialization
                          : (profile.user.specificSpecialization ?? "")
                      }
                      readOnly={!isEditingAcademic}
                      onChange={(e) =>
                        isEditingAcademic &&
                        setAcademicForm((f) => ({
                          ...f,
                          specificSpecialization: e.target.value,
                        }))
                      }
                      placeholder="يتم ملؤه من التدريسي"
                      className={isEditingAcademic ? editInputClass : readonlyInputClass}
                    />
                  </div>
                </div>

                {/* التخصص الدقيق — حاسوب فقط (صف كامل) */}
                <div className="hidden sm:block sm:col-span-2 space-y-1.5 min-w-0">
                  <Label className={labelClass}>التخصص الدقيق</Label>
                  <Input
                    value={
                      isEditingAcademic
                        ? academicForm.specificSpecialization
                        : (profile.user.specificSpecialization ?? "")
                    }
                    readOnly={!isEditingAcademic}
                    onChange={(e) =>
                      isEditingAcademic &&
                      setAcademicForm((f) => ({
                        ...f,
                        specificSpecialization: e.target.value,
                      }))
                    }
                    placeholder="يتم ملؤه من التدريسي"
                    className={isEditingAcademic ? editInputClass : readonlyInputClass}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* اكتمال الملف — يظهر على الحاسوب؛ الموبايل يعرض النسبة ضمن بطاقة الهوية */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20">
          <Card className={cardClass}>
            <CardHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
              <CardTitle className="text-base font-semibold text-slate-900">
                اكتمال الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">النسبة الإجمالية</span>
                  <span className="text-xl font-bold tabular-nums text-blue-600">
                    {completionPercent}%
                  </span>
                </div>
                <Progress value={completionPercent} className="h-2.5" />
              </div>

              <ul className="space-y-2">
                {completionItems.map((item) => (
                  <li
                    key={item.label}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                      item.completed
                        ? "border-emerald-100 bg-emerald-50/50"
                        : "border-amber-100 bg-amber-50/40"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      )}
                      <span
                        className={
                          item.completed
                            ? "text-slate-800 font-medium"
                            : "text-slate-600"
                        }
                      >
                        {item.label}
                      </span>
                    </span>
                    <span
                      className={`text-[11px] font-medium shrink-0 ${
                        item.completed ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {item.completed ? "مكتمل" : "ناقص"}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
