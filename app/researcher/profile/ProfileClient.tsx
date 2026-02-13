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

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <Card className="border-slate-100 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative flex-shrink-0 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    aria-label="الصورة الشخصية - رفع أو تغيير أو إزالة"
                  >
                    {avatarUrl ? (
                      <div className="h-14 w-14 rounded-full overflow-hidden">
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={56}
                          height={56}
                          className="object-cover"
                          unoptimized={avatarUrl.startsWith("/avatars/")}
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-700">{initials}</span>
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

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  {displayName}
                </h1>
                <p className="text-base text-slate-600 mb-1">
                  {profile.user.academicTitle || "—"}
                </p>
                <p className="text-sm text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0">
                  {profile.user.department && (
                    <span>{profile.user.department}</span>
                  )}
                  {profile.user.department && profile.user.entity && (
                    <span>•</span>
                  )}
                  {profile.user.entity && (
                    <span>{profile.user.entity}</span>
                  )}
                  {(profile.user.department || profile.user.entity) && (
                    <span>•</span>
                  )}
                  <span>جامعة البصرة</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                مكتمل
              </Badge>
            </div>
          </div>
          {avatarError && (
            <p className="text-sm text-red-600 mt-2">{avatarError}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  المعلومات الأساسية
                </CardTitle>
                {!isEditingBasicInfo ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm"
                    onClick={startEditingBasicInfo}
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل البيانات
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={saveBasicInfo}
                      disabled={basicInfoSaving}
                    >
                      <Save className="h-4 w-4 ml-2" />
                      {basicInfoSaving ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={cancelEditingBasicInfo}
                      disabled={basicInfoSaving}
                    >
                      <X className="h-4 w-4 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {basicInfoError && (
                <p className="text-sm text-red-600">{basicInfoError}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">الاسم الثلاثي (عربي)</Label>
                  <Input
                    value={profile.user.fullNameAr ?? displayName}
                    readOnly
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">الاسم الثلاثي (إنجليزي)</Label>
                  <Input
                    value={profile.user.fullNameEn ?? ""}
                    readOnly
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">اللقب العلمي</Label>
                  {isEditingBasicInfo ? (
                    <Select
                      value={basicInfoForm.academicTitle || ""}
                      onValueChange={(value) =>
                        setBasicInfoForm((f) => ({ ...f, academicTitle: value }))
                      }
                    >
                      <SelectTrigger className="h-10">
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
                      className="bg-slate-50 border-slate-200"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">البريد الجامعي</Label>
                  <Input
                    value={profile.user.email}
                    readOnly
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">رقم الهاتف</Label>
                  <Input
                    value={isEditingBasicInfo ? basicInfoForm.phone : (profile.user.phone ?? "")}
                    readOnly={!isEditingBasicInfo}
                    onChange={(e) =>
                      isEditingBasicInfo &&
                      setBasicInfoForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className={isEditingBasicInfo ? "" : "bg-slate-50 border-slate-200"}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">الجنس</Label>
                  <Input
                    value={profile.cvPersonal.gender ?? ""}
                    readOnly
                    className="bg-slate-50 border-slate-200"
                    placeholder="من صفحة السيرة الذاتية — المعلومات الشخصية"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">تاريخ الميلاد</Label>
                  <Input
                    value={
                      profile.cvPersonal.dateOfBirth
                        ? new Date(profile.cvPersonal.dateOfBirth).toISOString().slice(0, 10)
                        : ""
                    }
                    readOnly
                    className="bg-slate-50 border-slate-200"
                    placeholder="من صفحة السيرة الذاتية — المعلومات الشخصية"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">الرقم الوظيفي</Label>
                  <Input
                    value={isEditingBasicInfo ? basicInfoForm.employeeNumber : (profile.user.employeeNumber ?? "")}
                    readOnly={!isEditingBasicInfo}
                    onChange={(e) =>
                      isEditingBasicInfo &&
                      setBasicInfoForm((f) => ({ ...f, employeeNumber: e.target.value }))
                    }
                    className={isEditingBasicInfo ? "" : "bg-slate-50 border-slate-200"}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">سنة التعيين</Label>
                  <Input
                    value={isEditingBasicInfo ? basicInfoForm.appointmentYear : (profile.user.appointmentYear?.toString() ?? "")}
                    readOnly={!isEditingBasicInfo}
                    onChange={(e) =>
                      isEditingBasicInfo &&
                      setBasicInfoForm((f) => ({ ...f, appointmentYear: e.target.value }))
                    }
                    placeholder="مثال: 2020"
                    className={isEditingBasicInfo ? "" : "bg-slate-50 border-slate-200"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  الانتماء الأكاديمي
                </CardTitle>
                {!isEditingAcademic ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm"
                    onClick={startEditingAcademic}
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    {isAcademicComplete ? "تحديث البيانات" : "اكمال البيانات"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={saveAcademic}
                      disabled={academicSaving}
                    >
                      <Save className="h-4 w-4 ml-2" />
                      {academicSaving ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={cancelEditingAcademic}
                      disabled={academicSaving}
                    >
                      <X className="h-4 w-4 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {academicError && (
                <p className="text-sm text-red-600">{academicError}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    الجامعة
                  </Label>
                  <Input
                    value="جامعة البصرة"
                    readOnly
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
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
                      <SelectTrigger className="h-10">
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
                      className="bg-slate-50 border-slate-200"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    القسم
                  </Label>
                  {isEditingAcademic ? (
                    academicHasNoDepts ? (
                      <Input
                        value="لا توجد أقسام"
                        readOnly
                        className="bg-slate-50 border-slate-200"
                      />
                    ) : (
                      <Select
                        value={academicForm.department || ""}
                        onValueChange={(value) =>
                          setAcademicForm((f) => ({ ...f, department: value }))
                        }
                      >
                        <SelectTrigger className="h-10">
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
                      className="bg-slate-50 border-slate-200"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">التخصص العام</Label>
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
                    className={isEditingAcademic ? "" : "bg-slate-50 border-slate-200"}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">التخصص الدقيق</Label>
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
                    className={isEditingAcademic ? "" : "bg-slate-50 border-slate-200"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                اكتمال الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">النسبة الإجمالية</span>
                  <span className="text-lg font-bold text-[#2563EB]">
                    {completionPercent}%
                  </span>
                </div>
                <Progress value={completionPercent} className="h-2" />
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {completionItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span className={item.completed ? "text-slate-700" : "text-slate-500"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
