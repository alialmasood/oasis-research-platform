export type FacultyDegreeType =
  | "BACHELORS"
  | "DIPLOMA"
  | "HIGHER_DIPLOMA"
  | "MASTERS"
  | "PHD"
  | "BOARD";

export const DEGREE_LABELS: Record<FacultyDegreeType, string> = {
  BACHELORS: "بكالوريوس",
  DIPLOMA: "دبلوم",
  HIGHER_DIPLOMA: "دبلوم عالي",
  MASTERS: "ماجستير",
  PHD: "دكتوراه",
  BOARD: "بورد",
};

export type FacultyMember = {
  id: string;
  fullNameAr: string | null;
  fullNameEn: string | null;
  displayName: string;
  email: string;
  phone: string | null;
  academicTitle: string | null;
  entity: string | null;
  department: string | null;
  generalSpecialization: string | null;
  specificSpecialization: string | null;
  employeeNumber: string | null;
  appointmentYear: number | null;
  gender: string | null;
  avatarUrl: string | null;
  highestDegree: string | null;
  highestDegreeType: FacultyDegreeType | null;
  degreesCount: number;
  profileCompletePercent: number;
  isActive: boolean;
};

export type FacultyStats = {
  totalFaculty: number;
  totalDegrees: number;
  phdHolders: number;
  mastersHolders: number;
  entitiesCount: number;
  departmentsCount: number;
  completeProfiles: number;
  incompleteProfiles: number;
  withAcademicDegrees: number;
};

export const FACULTY_PAGE_SIZE = 50;

export type FacultyListFilters = {
  page: number;
  pageSize: number;
  search: string;
  entity: string;
  department: string;
  degree: string;
  completion: string;
};

export type FacultyPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rowOffset: number;
};

export type FacultyPageData = {
  faculty: FacultyMember[];
  stats: FacultyStats;
  entities: string[];
  departments: string[];
  pagination: FacultyPagination;
  filters: FacultyListFilters;
};

export type FacultyDegreeRecord = {
  id: string;
  degreeLabel: string;
  graduationYear: number;
  majorGeneral: string;
  majorSpecific: string | null;
  university: string;
  country: string;
};

export type FacultyMemberDetail = FacultyMember & {
  dateOfBirth: string | null;
  degrees: FacultyDegreeRecord[];
};
