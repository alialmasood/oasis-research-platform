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

  const isAdminInfoComplete = !!(
    profile.user.employeeNumber && profile.user.appointmentYear
  );

  const completionItems = [
    { label: "المعلومات الأساسية", completed: isBasicInfoComplete },
    { label: "الانتماء الأكاديمي", completed: isAcademicComplete },
    { label: "المعلومات الإدارية", completed: isAdminInfoComplete },
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

  const labelClass = "text-xs font-medium text-slate-500";
  const readonlyInputClass = "h-10 bg-slate-50 border-slate-200 text-slate-800";
  const editInputClass = "h-10";
  const cardClass = "border-slate-200/80 bg-white shadow-sm rounded-xl";
  const sectionHeaderClass =
    "flex flex-row items-center justify-between gap-3 space-y-0 border-b border-slate-100 pb-3";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* هوية الباحث */}
      <Card className={cardClass}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative flex-shrink-0 rounded-full overflow-hidden ring-2 ring-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    aria-label="الصورة الشخصية - رفع أو تغيير أو إزالة"
                  >
                    {avatarUrl ? (
                      <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-full overflow-hidden">
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
                      <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-full bg-blue-50 flex items-center justify-center">
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
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight truncate">
                  {displayName}
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  {profile.user.academicTitle || "—"}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-8 space-y-5">
          {/* المعلومات الأساسية */}
          <Card className={cardClass}>
            <CardHeader className={`px-4 sm:px-5 pt-4 sm:pt-5 ${sectionHeaderClass}`}>
              <CardTitle className="text-base font-semibold text-slate-900">
                المعلومات الأساسية
              </CardTitle>
              {!isEditingBasicInfo ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 border-slate-200 text-slate-700"
                  onClick={startEditingBasicInfo}
                >
                  <Edit className="h-3.5 w-3.5 ml-1.5" />
                  تعديل البيانات
                </Button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={saveBasicInfo}
                    disabled={basicInfoSaving}
                  >
                    <Save className="h-3.5 w-3.5 ml-1.5" />
                    {basicInfoSaving ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={cancelEditingBasicInfo}
                    disabled={basicInfoSaving}
                  >
                    <X className="h-3.5 w-3.5 ml-1.5" />
                    إلغاء
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-4 sm:px-5 py-4 space-y-5">
              {basicInfoError && (
                <p className="text-sm text-red-600">{basicInfoError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>الاسم الثلاثي (عربي)</Label>
                  <Input
                    value={profile.user.fullNameAr ?? displayName}
                    readOnly
                    className={readonlyInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>الاسم الثلاثي (إنجليزي)</Label>
                  <Input
                    value={profile.user.fullNameEn ?? ""}
                    readOnly
                    className={readonlyInputClass}
                  />
                </div>
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <Label className={labelClass}>البريد الجامعي</Label>
                  <Input
                    value={profile.user.email}
                    readOnly
                    className={readonlyInputClass}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3.5">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>رقم الهاتف</Label>
                    <Input
                      value={isEditingBasicInfo ? basicInfoForm.phone : (profile.user.phone ?? "")}
                      readOnly={!isEditingBasicInfo}
                      onChange={(e) =>
                        isEditingBasicInfo &&
                        setBasicInfoForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className={isEditingBasicInfo ? editInputClass : readonlyInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>الجنس</Label>
                    <Input
                      value={profile.cvPersonal.gender ?? ""}
                      readOnly
                      className={readonlyInputClass}
                      placeholder="من السيرة الذاتية"
                    />
                  </div>
                  <div className="space-y-1.5">
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
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 tracking-wide">
                  المعلومات الإدارية
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>الرقم الوظيفي</Label>
                    <Input
                      value={
                        isEditingBasicInfo
                          ? basicInfoForm.employeeNumber
                          : (profile.user.employeeNumber ?? "")
                      }
                      readOnly={!isEditingBasicInfo}
                      onChange={(e) =>
                        isEditingBasicInfo &&
                        setBasicInfoForm((f) => ({ ...f, employeeNumber: e.target.value }))
                      }
                      className={isEditingBasicInfo ? editInputClass : readonlyInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
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
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الانتماء الأكاديمي */}
          <Card className={cardClass}>
            <CardHeader className={`px-4 sm:px-5 pt-4 sm:pt-5 ${sectionHeaderClass}`}>
              <CardTitle className="text-base font-semibold text-slate-900">
                الانتماء الأكاديمي
              </CardTitle>
              {!isEditingAcademic ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 border-slate-200 text-slate-700"
                  onClick={startEditingAcademic}
                >
                  <Edit className="h-3.5 w-3.5 ml-1.5" />
                  {isAcademicComplete ? "تحديث البيانات" : "إكمال البيانات"}
                </Button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={saveAcademic}
                    disabled={academicSaving}
                  >
                    <Save className="h-3.5 w-3.5 ml-1.5" />
                    {academicSaving ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={cancelEditingAcademic}
                    disabled={academicSaving}
                  >
                    <X className="h-3.5 w-3.5 ml-1.5" />
                    إلغاء
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-4 sm:px-5 py-4">
              {academicError && (
                <p className="text-sm text-red-600 mb-3">{academicError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                <div className="space-y-1.5">
                  <Label className={`${labelClass} flex items-center gap-1.5`}>
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    الجامعة
                  </Label>
                  <Input value="جامعة البصرة" readOnly className={readonlyInputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={`${labelClass} flex items-center gap-1.5`}>
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    الكلية / التشكيل
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
                <div className="space-y-1.5">
                  <Label className={`${labelClass} flex items-center gap-1.5`}>
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
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
                <div className="space-y-1.5">
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
                <div className="space-y-1.5 sm:col-span-2">
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

        {/* اكتمال الملف */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20">
          <Card className={cardClass}>
            <CardHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100 space-y-0">
              <CardTitle className="text-base font-semibold text-slate-900">
                اكتمال الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-5 py-4 space-y-4">
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
