import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { getProfile } from "@/app/researcher/profile/actions";
import { prisma } from "@/lib/db";
import { getLastForm21Submission } from "./actions";
import { formDataFromJson, getHighestDegreeLabel } from "./utils";
import type { Form21Data } from "./types";
import { Form21PageClient } from "./Form21PageClient";

const UNIVERSITY_FIXED = "جامعة البصرة";

export default async function Form21Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, result, academicDegrees] = await Promise.all([
    getProfile(),
    getLastForm21Submission(),
    prisma.academicDegree.findMany({
      where: { userId: user.id },
    }),
  ]);

  let initialFormData: Form21Data | null = null;
  if (result.data?.formData) {
    initialFormData = formDataFromJson(result.data.formData);
  }

  const degreeFromDb = getHighestDegreeLabel(academicDegrees);
  const degreeValue = degreeFromDb || (initialFormData?.basic?.degree ?? "");

  const researcherBasic: Form21Data["basic"] | null = profile
    ? {
        university: UNIVERSITY_FIXED,
        college: profile.user.entity ?? "",
        department: profile.user.department ?? "",
        fullName:
          profile.user.fullNameAr?.trim() ||
          profile.user.fullNameEn?.trim() ||
          user.fullName ||
          "",
        scientificTitle: profile.user.academicTitle ?? "",
        degree: degreeValue,
        generalSpecialization: profile.user.generalSpecialization ?? "",
        specificSpecialization: profile.user.specificSpecialization ?? "",
        phone: profile.user.phone ?? "",
        email: profile.user.email ?? "",
      }
    : null;

  return (
    <Form21PageClient
      initialFormData={initialFormData}
      researcherBasic={researcherBasic}
      initialDegreeFromDb={degreeFromDb || undefined}
    />
  );
}
