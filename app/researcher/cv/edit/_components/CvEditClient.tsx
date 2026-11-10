"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowRight, User, MapPin, Languages, Code, Briefcase, X, Plus, Check } from "lucide-react";
import { upsertProfileCv, addLanguage, addSkill, addExperience, deleteLanguage, deleteSkill, deleteExperience } from "../../_actions";
import type { ProfileCV, Language, Skill, Experience } from "@prisma/client";

interface CvEditClientProps {
  initialProfileCv: (ProfileCV & {
    languages: Language[];
    skills: Skill[];
    experiences: Experience[];
  }) | null;
}

const genderOptions = [
  { value: "MALE", label: "ذكر" },
  { value: "FEMALE", label: "أنثى" },
  { value: "OTHER", label: "آخر" },
];

const nationalityOptions = [
  { value: "عربية", label: "عربية" },
  { value: "كردية", label: "كردية" },
];

const languageLevelOptions = [
  { value: "BEGINNER", label: "مبتدئ" },
  { value: "INTERMEDIATE", label: "متوسط" },
  { value: "ADVANCED", label: "متقدم" },
  { value: "NATIVE", label: "طليق" },
];

const skillLevelOptions = [
  { value: "LEVEL_1", label: "مبتدئ (1)" },
  { value: "LEVEL_2", label: "متوسط (2)" },
  { value: "LEVEL_3", label: "جيد (3)" },
  { value: "LEVEL_4", label: "متقدم (4)" },
  { value: "LEVEL_5", label: "خبير (5)" },
];

const navigationItems = [
  { id: "personal", label: "معلومات شخصية", icon: User },
  { id: "address", label: "عنوان السكن", icon: MapPin },
  { id: "languages", label: "اللغات", icon: Languages },
  { id: "skills", label: "المهارات", icon: Code },
  { id: "experiences", label: "الخبرات", icon: Briefcase },
];

export function CvEditClient({ initialProfileCv }: CvEditClientProps) {
  const router = useRouter();
  const [profileCv, setProfileCv] = useState(initialProfileCv);
  const [activeSection, setActiveSection] = useState("personal");
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);

  // Form states
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">(
    (profileCv?.gender as "MALE" | "FEMALE" | "OTHER") || ""
  );
  
  const [nationality, setNationality] = useState<"عربية" | "كردية" | "">(
    (profileCv?.nationality === "عربية" || profileCv?.nationality === "كردية") 
      ? profileCv.nationality as "عربية" | "كردية"
      : ""
  );
  
  // Track form values for isDirty check
  const [formValues, setFormValues] = useState({
    gender: profileCv?.gender || "",
    nationality: profileCv?.nationality || "",
    dateOfBirth: profileCv?.dateOfBirth ? new Date(profileCv.dateOfBirth).toISOString().split("T")[0] : "",
    province: profileCv?.province || "",
    district: profileCv?.district || "",
    area: profileCv?.area || "",
    address: profileCv?.address || "",
  });

  // Language form state
  const [languageName, setLanguageName] = useState("");
  const [languageLevel, setLanguageLevel] = useState("BEGINNER");

  // Skill form state
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("LEVEL_1");

  // Experience form state
  const [experienceTitle, setExperienceTitle] = useState("");
  const [experienceOrg, setExperienceOrg] = useState("");
  const [experienceStartDate, setExperienceStartDate] = useState("");
  const [experienceEndDate, setExperienceEndDate] = useState("");
  const [experienceDesc, setExperienceDesc] = useState("");

  useEffect(() => {
    if (profileCv) return;
    const controller = new AbortController();
    const fetchProfile = async () => {
      const response = await fetch("/api/researcher/cv", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        profileCv:
          | (ProfileCV & {
              languages: Language[];
              skills: Skill[];
              experiences: Experience[];
            })
          | null;
      };
      if (!data.profileCv) return;
      setProfileCv(data.profileCv);
      const nextGender = (data.profileCv.gender as "MALE" | "FEMALE" | "OTHER") || "";
      const nextNationality =
        data.profileCv.nationality === "عربية" || data.profileCv.nationality === "كردية"
          ? (data.profileCv.nationality as "عربية" | "كردية")
          : "";
      setGender(nextGender);
      setNationality(nextNationality);
      setFormValues({
        gender: data.profileCv.gender || "",
        nationality: data.profileCv.nationality || "",
        dateOfBirth: data.profileCv.dateOfBirth
          ? new Date(data.profileCv.dateOfBirth).toISOString().split("T")[0]
          : "",
        province: data.profileCv.province || "",
        district: data.profileCv.district || "",
        area: data.profileCv.area || "",
        address: data.profileCv.address || "",
      });
    };
    fetchProfile().catch(() => undefined);
    return () => controller.abort();
  }, [profileCv]);

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Calculate age from birth date
  const calculateAge = (birthDate: string | null | undefined): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const age = calculateAge(formValues.dateOfBirth);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDirty) return;

    const formData = new FormData(e.currentTarget);
    if (gender) {
      formData.set("gender", gender);
    }
    if (nationality) {
      formData.set("nationality", nationality);
    }

    startTransition(async () => {
      const result = await upsertProfileCv(formData);
      if (result.success) {
        setShowToast(true);
        // Wait for toast to show, then redirect
        setTimeout(() => {
          router.push("/researcher/cv");
          router.refresh();
        }, 1500);
      } else {
        alert(result.error || "حدث خطأ أثناء حفظ البيانات");
      }
    });
  };

  const handleGenderChange = (value: string) => {
    if (value === "MALE" || value === "FEMALE" || value === "OTHER") {
      setGender(value);
      setFormValues((prev) => ({ ...prev, gender: value }));
    }
  };

  const handleNationalityChange = (value: string) => {
    if (value === "عربية" || value === "كردية") {
      setNationality(value as "عربية" | "كردية");
      setFormValues((prev) => ({ ...prev, nationality: value }));
    }
  };

  // Check if form is dirty (has changes)
  const isDirty = (() => {
    const initial = {
      gender: initialProfileCv?.gender || "",
      nationality: initialProfileCv?.nationality || "",
      dateOfBirth: initialProfileCv?.dateOfBirth
        ? new Date(initialProfileCv.dateOfBirth).toISOString().split("T")[0]
        : "",
      province: initialProfileCv?.province || "",
      district: initialProfileCv?.district || "",
      area: initialProfileCv?.area || "",
      address: initialProfileCv?.address || "",
    };

    return (
      formValues.gender !== initial.gender ||
      formValues.nationality !== initial.nationality ||
      formValues.dateOfBirth !== initial.dateOfBirth ||
      formValues.province !== initial.province ||
      formValues.district !== initial.district ||
      formValues.area !== initial.area ||
      formValues.address !== initial.address
    );
  })();

  const handleAddLanguage = async () => {
    if (!languageName.trim()) return;

    const formData = new FormData();
    formData.set("name", languageName);
    formData.set("level", languageLevel);

    // Optimistic update: add to state immediately
    const tempId = `temp-${Date.now()}`;
    const newLanguage = {
      id: tempId,
      profileCvId: profileCv?.id || "",
      name: languageName,
      level: languageLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (profileCv) {
      setProfileCv({
        ...profileCv,
        languages: [...(profileCv.languages || []), newLanguage],
      });
    }

    setLanguageName("");
    setLanguageLevel("BEGINNER");

    startTransition(async () => {
      const result = await addLanguage(formData);
      if (result.success) {
        // Silently refresh to get the real ID from server (happens in background)
        router.refresh();
      } else {
        // Rollback on error
        if (profileCv) {
          setProfileCv({
            ...profileCv,
            languages: profileCv.languages.filter((lang) => lang.id !== tempId),
          });
        }
        alert(result.error || "حدث خطأ أثناء إضافة اللغة");
      }
    });
  };

  const handleDeleteLanguage = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه اللغة؟")) return;

    // Optimistic update: remove from state immediately
    const languageToDelete = profileCv?.languages.find((lang) => lang.id === id);
    if (profileCv && languageToDelete) {
      setProfileCv({
        ...profileCv,
        languages: profileCv.languages.filter((lang) => lang.id !== id),
      });
    }

    startTransition(async () => {
      const result = await deleteLanguage(id);
      if (!result.success) {
        // Rollback on error
        if (profileCv && languageToDelete) {
          setProfileCv({
            ...profileCv,
            languages: [...(profileCv.languages || []), languageToDelete],
          });
        }
        alert(result.error || "حدث خطأ أثناء حذف اللغة");
      }
    });
  };

  const handleAddSkill = async () => {
    if (!skillName.trim()) return;

    const formData = new FormData();
    formData.set("name", skillName);
    formData.set("level", skillLevel);

    // Optimistic update: add to state immediately
    const tempId = `temp-${Date.now()}`;
    const newSkill = {
      id: tempId,
      profileCvId: profileCv?.id || "",
      name: skillName,
      level: skillLevel as "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4" | "LEVEL_5",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (profileCv) {
      setProfileCv({
        ...profileCv,
        skills: [...(profileCv.skills || []), newSkill],
      });
    }

    setSkillName("");
    setSkillLevel("LEVEL_1");

    startTransition(async () => {
      const result = await addSkill(formData);
      if (result.success) {
        // Silently refresh to get the real ID from server (happens in background)
        router.refresh();
      } else {
        // Rollback on error
        if (profileCv) {
          setProfileCv({
            ...profileCv,
            skills: profileCv.skills.filter((skill) => skill.id !== tempId),
          });
        }
        alert(result.error || "حدث خطأ أثناء إضافة المهارة");
      }
    });
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المهارة؟")) return;

    // Optimistic update: remove from state immediately
    const skillToDelete = profileCv?.skills.find((skill) => skill.id === id);
    if (profileCv && skillToDelete) {
      setProfileCv({
        ...profileCv,
        skills: profileCv.skills.filter((skill) => skill.id !== id),
      });
    }

    startTransition(async () => {
      const result = await deleteSkill(id);
      if (!result.success) {
        // Rollback on error
        if (profileCv && skillToDelete) {
          setProfileCv({
            ...profileCv,
            skills: [...(profileCv.skills || []), skillToDelete],
          });
        }
        alert(result.error || "حدث خطأ أثناء حذف المهارة");
      }
    });
  };

  const handleAddExperience = async () => {
    if (!experienceTitle.trim() || !experienceOrg.trim() || !experienceStartDate) return;

    const formData = new FormData();
    formData.set("title", experienceTitle);
    formData.set("organization", experienceOrg);
    formData.set("startDate", experienceStartDate);
    if (experienceEndDate) {
      formData.set("endDate", experienceEndDate);
    }
    if (experienceDesc) {
      formData.set("description", experienceDesc);
    }

    // Optimistic update: add to state immediately
    const tempId = `temp-${Date.now()}`;
    const newExperience = {
      id: tempId,
      profileCvId: profileCv?.id || "",
      title: experienceTitle,
      organization: experienceOrg,
      startDate: new Date(experienceStartDate),
      endDate: experienceEndDate ? new Date(experienceEndDate) : null,
      description: experienceDesc || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (profileCv) {
      setProfileCv({
        ...profileCv,
        experiences: [...(profileCv.experiences || []), newExperience],
      });
    }

    setExperienceTitle("");
    setExperienceOrg("");
    setExperienceStartDate("");
    setExperienceEndDate("");
    setExperienceDesc("");

    startTransition(async () => {
      const result = await addExperience(formData);
      if (result.success) {
        // Silently refresh to get the real ID from server (happens in background)
        router.refresh();
      } else {
        // Rollback on error
        if (profileCv) {
          setProfileCv({
            ...profileCv,
            experiences: profileCv.experiences.filter((exp) => exp.id !== tempId),
          });
        }
        alert(result.error || "حدث خطأ أثناء إضافة الخبرة");
      }
    });
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخبرة؟")) return;

    // Optimistic update: remove from state immediately
    const experienceToDelete = profileCv?.experiences.find((exp) => exp.id === id);
    if (profileCv && experienceToDelete) {
      setProfileCv({
        ...profileCv,
        experiences: profileCv.experiences.filter((exp) => exp.id !== id),
      });
    }

    startTransition(async () => {
      const result = await deleteExperience(id);
      if (!result.success) {
        // Rollback on error
        if (profileCv && experienceToDelete) {
          setProfileCv({
            ...profileCv,
            experiences: [...(profileCv.experiences || []), experienceToDelete],
          });
        }
        alert(result.error || "حدث خطأ أثناء حذف الخبرة");
      }
    });
  };

  const levelLabels: Record<string, string> = {
    BEGINNER: "مبتدئ",
    INTERMEDIATE: "متوسط",
    ADVANCED: "متقدم",
    NATIVE: "طليق",
  };

  const skillLevelLabels: Record<string, string> = {
    LEVEL_1: "مبتدئ",
    LEVEL_2: "متوسط",
    LEVEL_3: "جيد",
    LEVEL_4: "متقدم",
    LEVEL_5: "خبير",
  };

  // Check section completion status (using same rules as calculateCvCompletion)
  const getSectionStatus = (sectionId: string): "completed" | "active" | "pending" => {
    const isActive = activeSection === sectionId;
    let isCompleted = false;

    switch (sectionId) {
      case "personal":
        // 1) معلومات شخصية: gender && nationality && dateOfBirth
        isCompleted = !!(profileCv?.gender && profileCv?.nationality && profileCv?.dateOfBirth);
        break;
      case "address":
        // 2) عنوان السكن: province && district && area
        isCompleted = !!(profileCv?.province && profileCv?.district && profileCv?.area);
        break;
      case "languages":
        // 3) اللغات: languages.length >= 1
        isCompleted = !!(profileCv?.languages && profileCv.languages.length >= 1);
        break;
      case "skills":
        // 4) المهارات: skills.length >= 1
        isCompleted = !!(profileCv?.skills && profileCv.skills.length >= 1);
        break;
      case "experiences":
        // 5) الخبرات: experiences.length >= 1
        isCompleted = !!(profileCv?.experiences && profileCv.experiences.length >= 1);
        break;
      default:
        isCompleted = false;
    }

    if (isActive) return "active";
    if (isCompleted) return "completed";
    return "pending";
  };

  // Calculate CV completion percentage
  const calculateCvCompletion = (cvData: typeof profileCv) => {
    const totalSections = 5;
    const sectionWeight = 20; // Each section = 20%
    let completedSections = 0;

    // 1) معلومات شخصية: gender && nationality && dateOfBirth
    if (cvData?.gender && cvData?.nationality && cvData?.dateOfBirth) {
      completedSections++;
    }

    // 2) عنوان السكن: province && district && area
    if (cvData?.province && cvData?.district && cvData?.area) {
      completedSections++;
    }

    // 3) اللغات: languages.length >= 1
    if (cvData?.languages && cvData.languages.length >= 1) {
      completedSections++;
    }

    // 4) المهارات: skills.length >= 1
    if (cvData?.skills && cvData.skills.length >= 1) {
      completedSections++;
    }

    // 5) الخبرات: experiences.length >= 1
    if (cvData?.experiences && cvData.experiences.length >= 1) {
      completedSections++;
    }

    const percentage = completedSections * sectionWeight;
    return {
      completedSections,
      totalSections,
      percentage,
    };
  };

  const completionData = calculateCvCompletion(profileCv);
  const completedSections = completionData.completedSections;
  const totalSections = completionData.totalSections;
  const completionPercentage = completionData.percentage;

  const fieldLabelClass =
    "text-[11px] md:text-xs font-medium text-slate-600 mb-1 block text-right";
  const fieldControlClass =
    "h-9 md:h-11 w-full rounded-lg md:rounded-xl border border-slate-200 bg-white px-2.5 md:px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-right";
  const sectionCardClass = (sectionId: string) =>
    `rounded-xl md:rounded-2xl border border-slate-200 bg-white p-3 md:p-5 relative gap-0 overflow-hidden ${
      getSectionStatus(sectionId) === "completed" ? "border-t-2 border-green-400" : ""
    }`;

  return (
    <div className="min-h-screen bg-[#F5F7FB] md:bg-[#F5F7FB]">
      <div className="max-w-7xl mx-auto px-0 md:px-6 py-3 md:py-6 min-w-0">
        {/* Header */}
        <div className="mb-3 md:mb-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-base md:text-2xl font-bold text-gray-900 truncate">
                تحرير السيرة الذاتية
              </h1>
              <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 md:mt-1 line-clamp-1">
                حدّث معلوماتك الشخصية والمهنية
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/researcher/cv")}
              className="rounded-lg md:rounded-xl h-8 md:h-10 shrink-0 px-2.5 md:px-4 text-xs md:text-sm"
            >
              <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
              رجوع
            </Button>
          </div>
        </div>

        {/* Completion Card */}
        <Card className="rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 p-3 md:p-4 mb-3 md:mb-6 gap-0">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs md:text-sm font-semibold text-slate-900">
                اكتمال السيرة الذاتية
              </h3>
              <span className="text-sm md:text-sm font-bold tabular-nums text-blue-600">
                {completionPercentage}%
              </span>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <p className="text-[11px] md:text-sm text-slate-600">
                {completedSections} من {totalSections} أقسام مكتملة
              </p>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} dir="rtl">
          {/* موبايل: شريط أقسام أفقي */}
          <div className="lg:hidden mb-3 -mx-0 overflow-x-auto">
            <div className="flex gap-1.5 min-w-max pb-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const status = getSectionStatus(item.id);
                const isActive = status === "active";
                const isCompleted = status === "completed";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      document
                        .getElementById(`cv-section-${item.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium border transition-colors shrink-0 ${
                      isActive
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : isCompleted
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : "bg-white border-slate-200 text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3 md:gap-8">
            {/* Left Sidebar - Navigation */}
            <aside className="hidden lg:block">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-1 sticky top-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const status = getSectionStatus(item.id);
                  const isActive = status === "active";
                  const isCompleted = status === "completed";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-sm text-right transition-all ${
                        isActive
                          ? "bg-blue-50 border border-blue-200 shadow-sm font-semibold text-blue-700"
                          : isCompleted
                            ? "bg-green-50/50 border border-green-100 text-green-700 hover:bg-green-50"
                            : "bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Icon
                            className={`h-4 w-4 ${isActive ? "text-blue-700" : "text-slate-400"}`}
                          />
                        )}
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Content - Form Sections */}
            <div className="space-y-3 md:space-y-5 min-w-0">
              {/* Card 1: معلومات شخصية */}
              <Card
                id="cv-section-personal"
                className={sectionCardClass("personal")}
              >
                {getSectionStatus("personal") === "completed" && (
                  <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                )}
                <h3 className="text-xs md:text-sm font-semibold text-slate-900 mb-0.5 md:mb-1">
                  معلومات شخصية
                </h3>
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 md:mt-1 mb-3 md:mb-4 leading-snug">
                  تُستخدم هذه المعلومات للأغراض الإحصائية فقط ولن تظهر للزوار.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 md:gap-4">
                  <div className="space-y-1 md:space-y-2 min-w-0">
                    <Label htmlFor="gender" className={fieldLabelClass}>
                      الجنس
                    </Label>
                    <Select value={gender} onValueChange={handleGenderChange}>
                      <SelectTrigger id="gender" className={fieldControlClass}>
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 md:space-y-2 min-w-0">
                    <Label htmlFor="nationality" className={fieldLabelClass}>
                      القومية
                    </Label>
                    <Select value={nationality} onValueChange={handleNationalityChange}>
                      <SelectTrigger
                        id="nationality"
                        name="nationality"
                        className={fieldControlClass}
                      >
                        <SelectValue placeholder="اختر القومية" />
                      </SelectTrigger>
                      <SelectContent>
                        {nationalityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 md:space-y-2 col-span-2 min-w-0">
                    <Label htmlFor="dateOfBirth" className={fieldLabelClass}>
                      تاريخ الميلاد
                    </Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={formValues.dateOfBirth}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                      }
                      className={`${fieldControlClass} text-left`}
                      dir="ltr"
                    />
                    <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                      {age !== null && (
                        <Badge className="inline-flex rounded-full bg-slate-100 text-slate-700 text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1">
                          العمر: {age} سنة
                        </Badge>
                      )}
                      <p className="text-[10px] md:text-[11px] text-slate-400 leading-4 text-right">
                        {age === null ? "سيتم حساب العمر تلقائياً" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 2: عنوان السكن */}
              <Card id="cv-section-address" className={sectionCardClass("address")}>
                {getSectionStatus("address") === "completed" && (
                  <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                )}
                <h3 className="text-xs md:text-sm font-semibold text-slate-900 mb-0.5 md:mb-1">
                  عنوان السكن
                </h3>
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 md:mt-1 mb-3 md:mb-4 leading-snug">
                  تساعد هذه البيانات في التحليل الجغرافي للباحثين.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 md:gap-4">
                  <div className="space-y-1 md:space-y-2 min-w-0">
                    <Label htmlFor="province" className={fieldLabelClass}>
                      المحافظة
                    </Label>
                    <Input
                      id="province"
                      name="province"
                      defaultValue={profileCv?.province || ""}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, province: e.target.value }))
                      }
                      placeholder="مثال: البصرة"
                      className={fieldControlClass}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2 min-w-0">
                    <Label htmlFor="district" className={fieldLabelClass}>
                      القضاء
                    </Label>
                    <Input
                      id="district"
                      name="district"
                      defaultValue={profileCv?.district || ""}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, district: e.target.value }))
                      }
                      placeholder="مثال: قضاء البصرة"
                      className={fieldControlClass}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2 col-span-2 min-w-0">
                    <Label htmlFor="area" className={fieldLabelClass}>
                      المنطقة
                    </Label>
                    <Input
                      id="area"
                      name="area"
                      defaultValue={profileCv?.area || ""}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, area: e.target.value }))
                      }
                      placeholder="مثال: منطقة كذا"
                      className={fieldControlClass}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2 col-span-2 min-w-0">
                    <Label htmlFor="address" className={fieldLabelClass}>
                      تفاصيل العنوان
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={profileCv?.address || ""}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="مثال: شارع كذا، مجمع كذا"
                      className={fieldControlClass}
                    />
                  </div>
                </div>
              </Card>

              {/* Card 3: اللغات */}
              <Card id="cv-section-languages" className={sectionCardClass("languages")}>
                {getSectionStatus("languages") === "completed" && (
                  <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                )}
                <h3 className="text-xs md:text-sm font-semibold text-slate-900 mb-0.5 md:mb-1">
                  اللغات
                </h3>
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 md:mt-1 mb-3 md:mb-4 leading-snug">
                  أضف اللغات التي تتقنها مع تحديد المستوى.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-[1fr_140px_100px] gap-2 md:gap-3 mb-3 md:mb-4">
                  <Input
                    placeholder="اسم اللغة"
                    value={languageName}
                    onChange={(e) => setLanguageName(e.target.value)}
                    className={`${fieldControlClass} col-span-2 md:col-span-1`}
                  />
                  <Select value={languageLevel} onValueChange={setLanguageLevel}>
                    <SelectTrigger className={fieldControlClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleAddLanguage}
                    disabled={isPending || !languageName.trim()}
                    className="h-9 md:h-11 rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs md:text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                    إضافة
                  </Button>
                </div>

                {profileCv?.languages && profileCv.languages.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {profileCv.languages.map((lang) => (
                      <div
                        key={lang.id}
                        className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-slate-200 bg-slate-50 text-[11px] md:text-sm group hover:bg-slate-100 transition-colors max-w-full"
                      >
                        <span className="font-medium text-gray-900 truncate">{lang.name}</span>
                        <Badge variant="outline" className="text-[10px] md:text-xs bg-white shrink-0">
                          {levelLabels[lang.level] || lang.level}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleDeleteLanguage(lang.id)}
                          disabled={isPending}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 ml-0.5 shrink-0"
                          aria-label="حذف اللغة"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl text-center py-4 md:py-6">
                    <Languages className="h-6 w-6 md:h-8 md:w-8 text-slate-300 mx-auto mb-1.5 md:mb-2" />
                    <p className="text-xs md:text-sm font-medium text-slate-700 mb-0.5 md:mb-1">
                      لم تتم إضافة عناصر بعد
                    </p>
                    <p className="text-[11px] md:text-xs text-slate-500">
                      ابدأ بإضافة البيانات لتحسين ملفك البحثي
                    </p>
                  </div>
                )}
              </Card>

              {/* Card 4: المهارات */}
              <Card id="cv-section-skills" className={sectionCardClass("skills")}>
                {getSectionStatus("skills") === "completed" && (
                  <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                )}
                <h3 className="text-xs md:text-sm font-semibold text-slate-900 mb-0.5 md:mb-1">
                  المهارات
                </h3>
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 md:mt-1 mb-3 md:mb-4 leading-snug">
                  أضف مهاراتك العلمية أو التقنية مع مستوى الإتقان.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-[1fr_140px_100px] gap-2 md:gap-3 mb-3 md:mb-4">
                  <Input
                    placeholder="اسم المهارة"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    className={`${fieldControlClass} col-span-2 md:col-span-1`}
                  />
                  <Select value={skillLevel} onValueChange={setSkillLevel}>
                    <SelectTrigger className={fieldControlClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={isPending || !skillName.trim()}
                    className="h-9 md:h-11 rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs md:text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                    إضافة
                  </Button>
                </div>

                {profileCv?.skills && profileCv.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {profileCv.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-slate-200 bg-slate-50 text-[11px] md:text-sm group hover:bg-slate-100 transition-colors max-w-full"
                      >
                        <span className="font-medium text-gray-900 truncate">{skill.name}</span>
                        <Badge variant="outline" className="text-[10px] md:text-xs bg-white shrink-0">
                          {skillLevelLabels[skill.level] || skill.level}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(skill.id)}
                          disabled={isPending}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 ml-0.5 shrink-0"
                          aria-label="حذف المهارة"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl text-center py-4 md:py-6">
                    <Code className="h-6 w-6 md:h-8 md:w-8 text-slate-300 mx-auto mb-1.5 md:mb-2" />
                    <p className="text-xs md:text-sm font-medium text-slate-700 mb-0.5 md:mb-1">
                      لم تتم إضافة عناصر بعد
                    </p>
                    <p className="text-[11px] md:text-xs text-slate-500">
                      ابدأ بإضافة البيانات لتحسين ملفك البحثي
                    </p>
                  </div>
                )}
              </Card>

              {/* Card 5: الخبرات */}
              <Card id="cv-section-experiences" className={sectionCardClass("experiences")}>
                {getSectionStatus("experiences") === "completed" && (
                  <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                )}
                <h3 className="text-xs md:text-sm font-semibold text-slate-900 mb-0.5 md:mb-1">
                  الخبرات
                </h3>
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 md:mt-1 mb-3 md:mb-4 leading-snug">
                  أدخل خبراتك المهنية أو الأكاديمية بالترتيب الزمني.
                </p>

                <div className="space-y-3 md:space-y-4 mb-3 md:mb-4 p-2.5 md:p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 md:gap-4">
                    <div className="space-y-1 md:space-y-2 min-w-0">
                      <Label className={fieldLabelClass}>المسمى الوظيفي *</Label>
                      <Input
                        placeholder="مثال: مطور برمجيات"
                        value={experienceTitle}
                        onChange={(e) => setExperienceTitle(e.target.value)}
                        className={fieldControlClass}
                      />
                    </div>
                    <div className="space-y-1 md:space-y-2 min-w-0">
                      <Label className={fieldLabelClass}>الجهة *</Label>
                      <Input
                        placeholder="مثال: شركة XYZ"
                        value={experienceOrg}
                        onChange={(e) => setExperienceOrg(e.target.value)}
                        className={fieldControlClass}
                      />
                    </div>
                    <div className="space-y-1 md:space-y-2 min-w-0">
                      <Label className={fieldLabelClass}>من *</Label>
                      <Input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={experienceStartDate}
                        onChange={(e) => setExperienceStartDate(e.target.value)}
                        className={`${fieldControlClass} text-left`}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1 md:space-y-2 min-w-0">
                      <Label className={fieldLabelClass}>إلى (اختياري)</Label>
                      <Input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={experienceEndDate}
                        onChange={(e) => setExperienceEndDate(e.target.value)}
                        className={`${fieldControlClass} text-left`}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1 md:space-y-2 col-span-2 min-w-0">
                      <Label className={fieldLabelClass}>الوصف (اختياري)</Label>
                      <Input
                        placeholder="وصف مختصر للخبرة..."
                        value={experienceDesc}
                        onChange={(e) => setExperienceDesc(e.target.value)}
                        className={fieldControlClass}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddExperience}
                    disabled={
                      isPending ||
                      !experienceTitle.trim() ||
                      !experienceOrg.trim() ||
                      !experienceStartDate
                    }
                    className="h-9 md:h-10 w-full md:w-auto rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs md:text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                    إضافة خبرة
                  </Button>
                </div>

                {profileCv?.experiences && profileCv.experiences.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {profileCv.experiences.map((exp) => {
                      const startDate = new Date(exp.startDate);
                      const endDate = exp.endDate ? new Date(exp.endDate) : null;
                      return (
                        <div
                          key={exp.id}
                          className="p-2.5 md:p-4 rounded-xl border border-slate-200 bg-slate-50/50 group hover:bg-slate-100/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-0.5 md:mb-1">
                                {exp.title}
                              </h4>
                              <p className="text-[11px] md:text-xs text-slate-600 mb-1 md:mb-2">
                                {exp.organization}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500">
                                <span>
                                  {startDate.getFullYear()} -{" "}
                                  {endDate ? endDate.getFullYear() : "حتى الآن"}
                                </span>
                              </div>
                              {exp.description && (
                                <p className="text-[11px] md:text-xs text-slate-600 mt-1.5 md:mt-2 leading-relaxed">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteExperience(exp.id)}
                              disabled={isPending}
                              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 shrink-0"
                              aria-label="حذف الخبرة"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl text-center py-4 md:py-6">
                    <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-slate-300 mx-auto mb-1.5 md:mb-2" />
                    <p className="text-xs md:text-sm font-medium text-slate-700 mb-0.5 md:mb-1">
                      لم تتم إضافة عناصر بعد
                    </p>
                    <p className="text-[11px] md:text-xs text-slate-500">
                      ابدأ بإضافة البيانات لتحسين ملفك البحثي
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Footer — موبايل: شريط سفلي ثابت */}
          <div className="mt-4 md:mt-8 pt-3 md:pt-6 border-t border-slate-200 flex justify-stretch md:justify-end gap-2 md:gap-3 sticky bottom-0 md:static bg-[#F5F7FB]/95 md:bg-transparent backdrop-blur md:backdrop-blur-none pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-0 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/researcher/cv")}
              disabled={isPending}
              className="h-9 md:h-10 flex-1 md:flex-none px-3 md:px-4 rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs md:text-sm"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className="h-9 md:h-10 flex-1 md:flex-none px-3 md:px-5 rounded-lg md:rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <span className="md:hidden">حفظ</span>
                  <span className="hidden md:inline">حفظ السيرة الذاتية</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message="تم حفظ السيرة الذاتية بنجاح"
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
