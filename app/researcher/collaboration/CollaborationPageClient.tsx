"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import {
  Plus,
  Loader2,
  Users,
  FolderOpen,
  Inbox,
  Sparkles,
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  Check,
  X,
  Send,
  Pencil,
  Lock,
  Unlock,
  Play,
  CheckCircle2,
  User,
  Tag,
  Briefcase,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  OPEN: "مفتوح",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  ARCHIVED: "مؤرشف",
};
const VISIBILITY_LABELS: Record<string, string> = {
  UNIVERSITY: "جامعي",
  COLLEGE_ONLY: "نفس الكلية",
  PRIVATE: "خاص",
};
const STATUS_BAR_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-slate-400",
  DRAFT: "bg-amber-400",
  ARCHIVED: "bg-slate-300",
};
const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: "متاح",
  LIMITED: "محدود",
  BUSY: "مشغول",
};

type Project = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  status: string;
  visibility: string;
  fields: string[];
  requiredRoles: string[];
  capacity: number;
  departmentId: string | null;
  tags: { tag: string }[];
  owner: { id: string; fullNameAr: string | null; fullNameEn: string | null };
  _count?: { members: number; joinRequests: number };
  updatedAt?: string;
};

type ProjectDetail = Project & {
  members: { researcherId: string; role: string; researcher: { fullNameAr: string | null; fullNameEn: string | null; email?: string } }[];
  joinRequests: { id: string; message: string | null; requester: { fullNameAr: string | null; fullNameEn: string | null } }[];
};

type KpiStats = {
  activeProjects: number;
  completedProjects: number;
  openProjects: number;
  pendingRequests: number;
  totalResearchers: number;
  availableResearchers: number;
  totalRecommendations: number;
  highPriorityRecommendations: number;
};

function AnimatedNumber({ value, loading }: { value: number; loading?: boolean }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (loading) return;
    const to = value;
    const step = to - display;
    if (step === 0) return;
    const t = 300;
    const steps = 10;
    const inc = step / steps;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplay((d) => Math.round(d + inc));
      if (i >= steps) {
        setDisplay(to);
        clearInterval(id);
      }
    }, t / steps);
    return () => clearInterval(id);
  }, [value, loading]);
  if (loading) return <span className="inline-block h-8 w-10 bg-slate-200 rounded animate-pulse" />;
  return <span>{display}</span>;
}

function KpiCard({
  title,
  value,
  loading,
  icon: Icon,
}: {
  title: string;
  value: number;
  loading?: boolean;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">
            <AnimatedNumber value={value} loading={loading} />
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const TAB_ITEMS = [
  { value: "discover", label: "استكشاف المشاريع", icon: Search },
  { value: "my", label: "مشاريعي", icon: FolderOpen },
  { value: "requests", label: "الطلبات", icon: Inbox },
  { value: "recommendations", label: "التوصيات", icon: Sparkles },
] as const;

function AnimatedTabUnderline({
  activeTab,
  tabRefs,
}: {
  activeTab: string;
  tabRefs: React.RefObject<(HTMLButtonElement | null)[]>;
}) {
  const [style, setStyle] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const idx = TAB_ITEMS.findIndex((t) => t.value === activeTab);
    const el = tabRefs.current?.[idx];
    if (!el) return;
    const update = () => setStyle({ left: el.offsetLeft, width: el.offsetWidth });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeTab, tabRefs]);
  return (
    <div
      className="absolute bottom-0 h-1 rounded-t-full bg-primary transition-[left,width] duration-200 ease-out shadow-sm"
      style={{ left: style.left, width: style.width }}
    />
  );
}

export function CollaborationPageClient() {
  const [stats, setStats] = useState<KpiStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [myProjectsLoading, setMyProjectsLoading] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsSubTab, setRequestsSubTab] = useState<"incoming" | "outgoing">("incoming");
  const [recommendations, setRecommendations] = useState<{ highPriority: any[]; recommended: any[] }>({ highPriority: [], recommended: [] });
  const [recsLoading, setRecsLoading] = useState(false);
  const [availableResearchers, setAvailableResearchers] = useState<any[]>([]);
  const [availableResearchersLoading, setAvailableResearchersLoading] = useState(false);
  const [suggestedResearchersByProject, setSuggestedResearchersByProject] = useState<Record<string, any[]>>({});
  const [suggestedLoadingByProject, setSuggestedLoadingByProject] = useState<Record<string, boolean>>({});
  const [researcherDetailOpen, setResearcherDetailOpen] = useState(false);
  const [selectedResearcher, setSelectedResearcher] = useState<any | null>(null);
  const [allResearchersOpen, setAllResearchersOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("discover");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<ProjectDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [joinModalProjectId, setJoinModalProjectId] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "__all__",
    sort: "newest",
    tags: [] as string[],
    departmentId: "__all__",
    slotsLeftMin: "" as "" | number,
  });
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [discoverViewMode, setDiscoverViewMode] = useState<"grid" | "list">("grid");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ message: msg, type });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.user?.id && setCurrentUserId(d.user.id))
      .catch(() => {});
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/collaboration/stats", { credentials: "include" });
      if (res.ok) setStats(await res.json());
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "__all__") params.set("status", filters.status);
      const res = await fetch(`/api/collaboration/projects?${params}`, { credentials: "include" });
      if (res.ok) setProjects(await res.json());
    } finally {
      setProjectsLoading(false);
    }
  }, [filters.status]);

  const fetchMyProjects = useCallback(async () => {
    setMyProjectsLoading(true);
    try {
      const res = await fetch("/api/collaboration/projects?mine=1", { credentials: "include" });
      if (res.ok) setMyProjects(await res.json());
    } finally {
      setMyProjectsLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        fetch("/api/collaboration/requests?type=incoming", { credentials: "include" }),
        fetch("/api/collaboration/requests?type=outgoing", { credentials: "include" }),
      ]);
      if (inRes.ok) setIncomingRequests(await inRes.json());
      if (outRes.ok) setOutgoingRequests(await outRes.json());
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setRecsLoading(true);
    try {
      const res = await fetch("/api/collaboration/recommendations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRecommendations({ highPriority: data.highPriority ?? [], recommended: data.recommended ?? [] });
      }
    } finally {
      setRecsLoading(false);
    }
  }, []);

  const fetchAvailableResearchers = useCallback(async () => {
    setAvailableResearchersLoading(true);
    try {
      const res = await fetch("/api/collaboration/available-researchers", { credentials: "include" });
      if (res.ok) setAvailableResearchers(await res.json());
    } finally {
      setAvailableResearchersLoading(false);
    }
  }, []);

  const fetchSuggestedForProject = useCallback(async (projectId: string) => {
    setSuggestedLoadingByProject((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await fetch(`/api/collaboration/projects/${projectId}/suggested-researchers`, { credentials: "include" });
      if (res.ok) {
        const list = await res.json();
        setSuggestedResearchersByProject((prev) => ({ ...prev, [projectId]: list ?? [] }));
      }
    } finally {
      setSuggestedLoadingByProject((prev) => ({ ...prev, [projectId]: false }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRecommendations();
  }, [fetchStats, fetchRecommendations]);

  useEffect(() => {
    if (activeTab === "discover") {
      fetchProjects();
      fetchAvailableResearchers();
    } else if (activeTab === "my") fetchMyProjects();
    else if (activeTab === "requests") fetchRequests();
    else if (activeTab === "recommendations") fetchRecommendations();
  }, [activeTab, fetchProjects, fetchMyProjects, fetchRequests, fetchRecommendations, fetchAvailableResearchers]);

  useEffect(() => {
    myProjects.forEach((p) => fetchSuggestedForProject(p.id));
  }, [myProjects, fetchSuggestedForProject]);

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/collaboration/projects/${id}`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setDetailProject(data);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailProject(null);
    fetchStats();
    fetchProjects();
    fetchMyProjects();
    fetchRequests();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = createForm;
    const err: typeof createFormErrors = {};
    if (form.title.trim().length < 5) err.title = "العنوان 5 أحرف على الأقل";
    if (form.summary.trim().length < 20) err.summary = "الملخص 20 حرفاً على الأقل";
    if (form.description.trim().length < 1) err.description = "الوصف مطلوب";
    if (form.tags.length > 12) err.tags = "الحد الأقصى 12 وسم";
    setCreateFormErrors(err);
    if (Object.keys(err).length > 0) return;

    setCreateSaving(true);
    const res = await fetch("/api/collaboration/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
        visibility: form.visibility,
        departmentId: form.departmentId === "__none__" || !form.departmentId ? null : form.departmentId,
        fields: [],
        requiredRoles: form.requiredRoles.filter(Boolean),
        capacity: Number(form.capacity) || 5,
        tags: form.tags.filter(Boolean),
      }),
    });
    const data = await res.json().catch(() => null);
    setCreateSaving(false);
    if (!res.ok) {
      showToast(data?.error ?? "فشل الإنشاء", "error");
      return;
    }
    showToast("تم إنشاء المشروع بنجاح");
    setCreateOpen(false);
    setCreateForm(createFormInit);
    setTagInput("");
    setRoleInput("");
    setCreateFormErrors({});
    fetchStats();
    fetchMyProjects();
    fetchProjects();
    if (data?.id) {
      setDetailProject(data);
      setDetailOpen(true);
    }
  };

  const handleJoinRequest = async (projectId: string) => {
    setJoiningId(projectId);
    try {
      const res = await fetch(`/api/collaboration/projects/${projectId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: joinMessage.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? "فشل إرسال الطلب", "error");
        setJoiningId(null);
        return;
      }
      showToast("تم إرسال طلب الانضمام");
      setJoinMessage("");
      setJoinModalProjectId(null);
      closeDetail();
      fetchProjects();
      fetchRecommendations();
    } catch {
      showToast("حدث خطأ", "error");
    }
    setJoiningId(null);
  };

  const handleRequestDecision = async (requestId: string, status: "APPROVED" | "REJECTED" | "CANCELED") => {
    const res = await fetch(`/api/collaboration/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err?.error ?? "فشل في تنفيذ الإجراء", "error");
      return;
    }
    if (status === "APPROVED") showToast("تم قبول الطلب");
    else if (status === "REJECTED") showToast("تم رفض الطلب");
    else showToast("تم إلغاء الطلب");
    if (detailProject) openDetail(detailProject.id);
    fetchRequests();
    fetchStats();
  };

  const handleUpdateStatus = async (projectId: string, status: string) => {
    const res = await fetch(`/api/collaboration/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      showToast("فشل التحديث", "error");
      return;
    }
    showToast("تم تحديث الحالة");
    if (detailProject?.id === projectId) openDetail(projectId);
    fetchMyProjects();
    fetchStats();
  };

  const createFormInit = {
    title: "",
    summary: "",
    description: "",
    status: "OPEN",
    visibility: "UNIVERSITY",
    departmentId: "__none__",
    capacity: 5,
    tags: [] as string[],
    requiredRoles: [] as string[],
  };
  const [createForm, setCreateForm] = useState(createFormInit);
  const [createFormErrors, setCreateFormErrors] = useState<{ title?: string; summary?: string; description?: string; tags?: string }>({});
  const [createSaving, setCreateSaving] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [roleInput, setRoleInput] = useState("");

  useEffect(() => {
    if (createOpen || activeTab === "discover") {
      fetch("/api/departments", { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then(setDepartments)
        .catch(() => []);
    }
  }, [createOpen, activeTab]);

  const recommendedProjectIds = new Set([
    ...(recommendations.highPriority ?? []).map((r: any) => r.project?.id).filter(Boolean),
    ...(recommendations.recommended ?? []).map((r: any) => r.project?.id).filter(Boolean),
  ]);
  const highPriorityProjectIds = new Set((recommendations.highPriority ?? []).map((r: any) => r.project?.id).filter(Boolean));

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t.tag)));
    return Array.from(set).sort();
  }, [projects]);

  const filteredDiscover = useMemo(() => {
    let list = projects;
    if (filtersApplied) {
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.summary ?? "").toLowerCase().includes(q) ||
            (p.tags ?? []).some((t) => t.tag.toLowerCase().includes(q))
        );
      }
      if (filters.status && filters.status !== "__all__") list = list.filter((p) => p.status === filters.status);
      if ((filters.tags ?? []).length > 0) list = list.filter((p) => (p.tags ?? []).some((t) => filters.tags!.includes(t.tag)));
      if (filters.departmentId && filters.departmentId !== "__all__") list = list.filter((p) => p.departmentId === filters.departmentId);
      const minSlots = filters.slotsLeftMin;
      if (minSlots !== "" && typeof minSlots === "number") {
        list = list.filter((p) => (p.capacity ?? 0) - (p._count?.members ?? 0) >= minSlots);
      }
    }
    return list;
  }, [projects, filtersApplied, filters.search, filters.status, filters.tags, filters.departmentId, filters.slotsLeftMin]);

  const sortedDiscover = useMemo(() => {
    if (filters.sort === "newest") {
      return [...filteredDiscover].sort((a, b) => new Date((b as any).updatedAt || 0).getTime() - new Date((a as any).updatedAt || 0).getTime());
    }
    if (filters.sort === "closing") {
      return [...filteredDiscover].sort((a, b) => {
        const slotsA = (a.capacity ?? 0) - (a._count?.members ?? 0);
        const slotsB = (b.capacity ?? 0) - (b._count?.members ?? 0);
        return slotsA - slotsB;
      });
    }
    return filteredDiscover;
  }, [filteredDiscover, filters.sort]);

  return (
    <div className="space-y-4" dir="rtl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* (1) Header + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">التعاون الأكاديمي المشترك</h1>
          <p className="text-sm text-slate-500 mt-1">اعرض مشاريع البحث، انضم أو أنشئ مشروعك وادعُ باحثين للتعاون</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setCreateOpen(true); setCreateForm(createFormInit); setTagInput(""); setRoleInput(""); setCreateFormErrors({}); }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 ml-2" />
            إنشاء مشروع جديد
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("my")}>
            <FolderOpen className="h-4 w-4 ml-2" />
            مشاريعي
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("requests")}>
            <Inbox className="h-4 w-4 ml-2" />
            الطلبات الواردة
            {stats && stats.pendingRequests > 0 && (
              <Badge className="mr-2 bg-amber-500">{stats.pendingRequests}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* (2) KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <KpiCard title="مشاريع نشطة" value={stats?.activeProjects ?? 0} loading={statsLoading} icon={Play} />
        <KpiCard title="مشاريع مكتملة" value={stats?.completedProjects ?? 0} loading={statsLoading} icon={CheckCircle2} />
        <KpiCard title="مشاريع مفتوحة" value={stats?.openProjects ?? 0} loading={statsLoading} icon={Unlock} />
        <KpiCard title="طلبات معلقة" value={stats?.pendingRequests ?? 0} loading={statsLoading} icon={Inbox} />
        <KpiCard title="إجمالي الباحثين" value={stats?.totalResearchers ?? 0} loading={statsLoading} icon={Users} />
        <KpiCard title="باحثون متاحون" value={stats?.availableResearchers ?? 0} loading={statsLoading} icon={User} />
        <KpiCard title="إجمالي التوصيات" value={stats?.totalRecommendations ?? 0} loading={statsLoading} icon={Sparkles} />
        <KpiCard title="توصيات عالية الأولوية" value={stats?.highPriorityRecommendations ?? 0} loading={statsLoading} icon={Sparkles} />
      </div>

      {/* (2.5) التوصيات الذكية لك — Compact: empty min-h-[160px]، زر عرض الكل بجانب العنوان، Grid بحد أقصى صفين */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-amber-500" />
                التوصيات الذكية لك
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">مشاريع مناسبة لاهتماماتك ومهاراتك</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => setActiveTab("recommendations")}>
              عرض كل التوصيات
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[88px] rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (() => {
            const topRecs = [
              ...(recommendations.highPriority ?? []).slice(0, 6),
              ...(recommendations.recommended ?? []).filter((r: any) => !(recommendations.highPriority ?? []).some((h: any) => h.project?.id === r.project?.id)).slice(0, Math.max(0, 6 - (recommendations.highPriority ?? []).length)),
            ].slice(0, 6);
            if (topRecs.length === 0) {
              return (
                <div className="min-h-[160px] rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 flex flex-col items-center justify-center text-center">
                  <Sparkles className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">لا توجد توصيات بعد</p>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xs">أكمل اهتماماتك ومهاراتك في الملف الشخصي</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => (window.location.href = "/researcher/profile")}>
                    أكمل ملفك للحصول على توصيات
                  </Button>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[inherit]">
                {topRecs.slice(0, 6).map((item: any, idx: number) => {
                  const isHigh = (recommendations.highPriority ?? []).some((h: any) => h.project?.id === item.project?.id);
                  return (
                    <Card key={item.project?.id ?? idx} className={`overflow-hidden ${isHigh ? "border-amber-200/80 bg-amber-50/30" : "border-slate-100"}`}>
                      <CardContent className="p-3">
                        {isHigh && <Badge className="mb-1.5 text-[10px] bg-amber-500">أولوية عالية</Badge>}
                        <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{item.project?.title ?? "—"}</h3>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{item.project?.summary ?? "—"}</p>
                        <Button size="sm" className="mt-2 w-full h-8 text-xs" variant={isHigh ? "default" : "outline"} onClick={() => openDetail(item.project?.id)}>
                          عرض التفاصيل
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* (3) Tabs — تبويبات مع لون نشط + خط سفلي متحرك + أيقونات + عداد (TabsList مطلوب لـ RovingFocusGroup) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative border-b border-slate-200 mt-4">
          <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-none border-0 bg-transparent p-0 shadow-none">
            {TAB_ITEMS.map(({ value, label, icon: Icon }, idx) => {
              const count =
                value === "discover"
                  ? projects.length
                  : value === "my"
                    ? myProjects.length
                    : value === "requests"
                      ? incomingRequests.length + outgoingRequests.length
                      : (recommendations.highPriority?.length ?? 0) + (recommendations.recommended?.length ?? 0);
              return (
                <TabsTrigger
                  key={value}
                  value={value}
                  ref={(el) => {
                    if (!tabRefs.current) tabRefs.current = [];
                    tabRefs.current[idx] = el as HTMLButtonElement | null;
                  }}
                  className="relative z-[1] flex-1 rounded-t-md border-0 border-b-2 border-transparent bg-transparent px-4 py-3 text-slate-600 shadow-none outline-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none hover:text-slate-900 hover:data-[state=active]:text-primary lg:flex-none"
                >
                  <Icon className="h-4 w-4 ml-2 shrink-0" />
                  <span>{label}</span>
                  <Badge
                    variant={activeTab === value ? "default" : "secondary"}
                    className="mr-2 h-5 min-w-5 rounded-full px-1.5 text-xs font-medium"
                  >
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <AnimatedTabUnderline activeTab={activeTab} tabRefs={tabRefs} />
        </div>

        {/* Discover: FiltersBar — Grid lg:grid-cols-12، سطر واحد على الشاشات الكبيرة */}
        <TabsContent value="discover" className="mt-4 space-y-4">
          <Card className="border-slate-200">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                {/* بحث: يمتد */}
                <div className="md:col-span-2 lg:col-span-4">
                  <Label className="text-xs">بحث</Label>
                  <Input
                    placeholder="عنوان، ملخص، وسم..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                {/* الحالة */}
                <div className="lg:col-span-2">
                  <Label className="text-xs">الحالة</Label>
                  <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* الكلية / القسم */}
                <div className="lg:col-span-2">
                  <Label className="text-xs">الكلية / القسم</Label>
                  <Select value={filters.departmentId} onValueChange={(v) => setFilters((f) => ({ ...f, departmentId: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">الكل</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* الوسوم */}
                <div className="lg:col-span-2">
                  <Label className="text-xs">الوسوم</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="mt-1 w-full justify-between">
                        <span className="truncate">{(filters.tags?.length ?? 0) > 0 ? `تم اختيار ${filters.tags!.length}` : "الكل"}</span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                      {availableTags.length === 0 ? (
                        <div className="px-2 py-2 text-sm text-slate-500">لا وسوم متاحة</div>
                      ) : (
                        availableTags.map((tag) => (
                          <DropdownMenuCheckboxItem
                            key={tag}
                            checked={(filters.tags ?? []).includes(tag)}
                            onCheckedChange={(checked) => {
                              setFilters((f) => ({
                                ...f,
                                tags: checked ? [...(f.tags ?? []), tag] : (f.tags ?? []).filter((t) => t !== tag),
                              }));
                            }}
                          >
                            {tag}
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* الترتيب */}
                <div className="lg:col-span-2">
                  <Label className="text-xs">الترتيب</Label>
                  <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="relevant">الأكثر صلة</SelectItem>
                      <SelectItem value="closing">قريب الإغلاق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* سطر الأزرار: تطبيق + إعادة تعيين + Grid/List */}
                <div className="flex flex-wrap gap-2 justify-end items-center md:col-span-2 lg:col-span-12 pt-1">
                  <Button size="sm" onClick={() => { setFiltersApplied(true); fetchProjects(); }}>
                    <Filter className="h-4 w-4 ml-2" /> تطبيق
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setFilters({ search: "", status: "__all__", sort: "newest", tags: [], departmentId: "__all__", slotsLeftMin: "" }); setFiltersApplied(false); fetchProjects(); }}>
                    <RotateCcw className="h-4 w-4 ml-2" /> إعادة تعيين
                  </Button>
                  <div className="flex border rounded-md overflow-hidden shrink-0">
                    <Button size="sm" variant={discoverViewMode === "grid" ? "secondary" : "ghost"} className="rounded-none" onClick={() => setDiscoverViewMode("grid")} title="شبكة"><LayoutGrid className="h-4 w-4" /></Button>
                    <Button size="sm" variant={discoverViewMode === "list" ? "secondary" : "ghost"} className="rounded-none" onClick={() => setDiscoverViewMode("list")} title="قائمة"><List className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {projectsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
                    <div className="h-9 bg-slate-100 rounded animate-pulse w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : discoverViewMode === "list" ? (
            <div className="space-y-2">
              {sortedDiscover.map((p) => (
                <Card key={p.id} className="border-slate-100 hover:shadow-md transition-shadow overflow-hidden">
                  <CardContent className="p-3 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{p.title}</h3>
                        {recommendedProjectIds.has(p.id) && <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">موصى لك</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.summary}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{STATUS_LABELS[p.status] ?? p.status}</Badge>
                        <span className="text-xs text-slate-400">• {p.owner?.fullNameAr || p.owner?.fullNameEn || "—"}</span>
                        <span className="text-xs text-slate-400">• {p._count?.members ?? 0}/{p.capacity}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openDetail(p.id)}>عرض التفاصيل</Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setJoinModalProjectId(p.id); setJoinMessage(""); }}>طلب انضمام</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedDiscover.map((p) => {
                const members = p._count?.members ?? (p as any).members?.length ?? 0;
                const capacity = p.capacity || 1;
                const statusBarClass = STATUS_BAR_COLORS[p.status] ?? "bg-slate-300";
                const isRecommended = recommendedProjectIds.has(p.id);
                const tags = p.tags ?? [];
                const tagsShow = tags.slice(0, 3);
                const tagsExtra = tags.length > 3 ? tags.length - 3 : 0;
                const joinRequests = p._count?.joinRequests ?? 0;
                return (
                  <Card
                    key={p.id}
                    className="border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ring-1 ring-transparent hover:ring-slate-200/80"
                  >
                    {/* A) Header صغير: شريط لون + عنوان + Badges */}
                    <div className={`h-1 shrink-0 ${statusBarClass}`} />
                    <div className="h-20 shrink-0 bg-slate-50/80 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' stroke='%2394a3b8' stroke-width='0.4'/%3E%3C/svg%3E\")" }} />
                      {isRecommended && (
                        <Badge className="absolute top-2 right-2 text-[10px] bg-amber-500/90 text-white border-0">موصى به</Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      {/* عنوان + حالة + رؤية */}
                      <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 flex-1 min-w-0">{p.title}</h3>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{STATUS_LABELS[p.status] ?? p.status}</Badge>
                        <Badge variant="outline" className="text-[10px] shrink-0">{VISIBILITY_LABELS[p.visibility]}</Badge>
                      </div>
                      {/* B) Body: Summary + Tags + صف معلومات */}
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{p.summary ?? "—"}</p>
                      <div className="flex flex-wrap gap-1 mt-2 items-center">
                        {tagsShow.map((t) => (
                          <span key={t.tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">{t.tag}</span>
                        ))}
                        {tagsExtra > 0 && <span className="text-[10px] text-slate-400">+{tagsExtra}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-0.5"><User className="h-3.5 w-3.5" /> {p.owner?.fullNameAr || p.owner?.fullNameEn || "—"}</span>
                        <span className="flex items-center gap-0.5"><Users className="h-3.5 w-3.5" /> {members}/{capacity}</span>
                        {joinRequests > 0 && <span className="flex items-center gap-0.5"><Inbox className="h-3.5 w-3.5" /> الطلبات {joinRequests}</span>}
                      </div>
                      {/* C) Footer: أزرار */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => openDetail(p.id)}>عرض التفاصيل</Button>
                        <Button size="sm" className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => { setJoinModalProjectId(p.id); setJoinMessage(""); }}>طلب انضمام</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          {!projectsLoading && sortedDiscover.length === 0 && (
            <Card className="border-slate-200"><CardContent className="py-12 text-center text-slate-500">لا توجد مشاريع تطابق البحث</CardContent></Card>
          )}

          {/* باحثون متاحون حالياً — Grid بطاقات صغيرة 3–4 بالسطر + عرض الكل */}
          <Card className="mt-6 border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-slate-600" />
                    باحثون متاحون حالياً
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">اعرض الملف أو ادعُهم لمشروعك</CardDescription>
                </div>
                {availableResearchers.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-primary" onClick={() => setAllResearchersOpen(true)}>
                    عرض الكل
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {availableResearchersLoading ? (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-32 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : availableResearchers.length === 0 ? (
                <p className="text-slate-500 text-center py-6 text-sm">لا يوجد باحثون متاحون لعرضهم حالياً</p>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {availableResearchers.slice(0, 8).map((r: any) => (
                    <Card key={r.id} className="border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-2">
                          {r.avatarUrl ? (
                            <img src={r.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold shrink-0">
                              {(r.fullNameAr || r.fullNameEn || "?")[0]}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-slate-800 text-xs truncate">{r.fullNameAr || r.fullNameEn || "—"}</h4>
                            {r.college && <p className="text-[10px] text-slate-500 truncate">{r.college}</p>}
                          </div>
                        </div>
                        {r.specialization && <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">{r.specialization}</p>}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500">{r.researchCount ?? 0} بحث</span>
                          {r.availabilityStatus && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{AVAILABILITY_LABELS[r.availabilityStatus] ?? r.availabilityStatus}</Badge>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] px-1.5" onClick={() => { setSelectedResearcher(r); setResearcherDetailOpen(true); }}>عرض الملف</Button>
                          <Button size="sm" className="flex-1 h-7 text-[10px] px-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => showToast("دعوة للمشروع قريباً", "success")}>دعوة</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my" className="mt-4">
          {myProjectsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><div className="h-20 bg-slate-100 rounded animate-pulse" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {myProjects.map((p) => (
                <div key={p.id}>
                  <Card className="border-slate-100 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-800">{p.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.summary}</p>
                      <Badge variant="outline" className="mt-2">{STATUS_LABELS[p.status]}</Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-2"><Users className="h-4 w-4" /><span>{p._count?.members ?? 0} / {p.capacity}</span></div>
                      <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => openDetail(p.id)}>عرض / إدارة</Button>
                    </CardContent>
                  </Card>
                  {/* باحثون مناسبون لهذا المشروع (Top 5) */}
                  <div className="mt-3 pr-2 border-r-2 border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">باحثون مناسبون لهذا المشروع</h4>
                    {suggestedLoadingByProject[p.id] ? (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-36 shrink-0 h-28 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                      </div>
                    ) : (suggestedResearchersByProject[p.id] ?? []).length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">لا توجد توصيات حالياً</p>
                    ) : (
                      <div className="flex gap-3 flex-wrap">
                        {(suggestedResearchersByProject[p.id] ?? []).map((r: any) => (
                          <Card key={r.id} className="w-40 shrink-0 border-slate-100">
                            <CardContent className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold">
                                  {(r.fullNameAr || r.fullNameEn || "?")[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-800 text-xs truncate">{r.fullNameAr || r.fullNameEn || "—"}</p>
                                  <Badge className="mt-0.5 text-[10px] bg-emerald-100 text-emerald-800">متوافق {r.scorePercent}%</Badge>
                                </div>
                              </div>
                              {r.college && <p className="text-[10px] text-slate-500 mt-1 truncate">{r.college}</p>}
                              <div className="flex gap-1 mt-2">
                                <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => { setSelectedResearcher(r); setResearcherDetailOpen(true); }}>عرض الملف</Button>
                                <Button size="sm" className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => showToast("دعوة قريباً", "success")}>دعوة</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!myProjectsLoading && myProjects.length === 0 && (
            <Card className="border-slate-200"><CardContent className="py-12 text-center text-slate-500">لا توجد مشاريع خاصة بك بعد</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          {requestsLoading ? (
            <Card><CardContent className="p-6"><div className="h-32 bg-slate-100 rounded animate-pulse" /></CardContent></Card>
          ) : (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>إدارة الطلبات</CardTitle>
                <CardDescription>طلبات واردة لمشاريعي أو صادرة منك للمشاريع الأخرى</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={requestsSubTab} onValueChange={(v) => setRequestsSubTab(v as "incoming" | "outgoing")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-xs">
                    <TabsTrigger value="incoming">الواردة (لمشاريعي)</TabsTrigger>
                    <TabsTrigger value="outgoing">الصادرة (طلباتي)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="incoming" className="mt-4 space-y-3">
                    {incomingRequests.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">لا توجد طلبات واردة</p>
                    ) : (
                      incomingRequests.map((r: any) => (
                        <div key={r.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{r.requester?.fullNameAr || r.requester?.fullNameEn || "—"}</span>
                            <Badge variant={r.status === "PENDING" ? "secondary" : r.status === "APPROVED" ? "default" : "destructive"}>{r.status === "PENDING" ? "معلق" : r.status === "APPROVED" ? "مقبول" : r.status === "REJECTED" ? "مرفوض" : "ملغى"}</Badge>
                          </div>
                          {r.requester?.departmentRelation?.name && <p className="text-xs text-slate-500">القسم: {r.requester.departmentRelation.name}</p>}
                          {(r.requesterSkills?.length ?? 0) > 0 && (
                            <p className="text-xs text-slate-600">مهارات: {(r.requesterSkills ?? []).map((s: any) => s.skill).join("، ").slice(0, 80)}{(r.requesterSkills?.length > 2 ? "…" : "")}</p>
                          )}
                          <p className="text-sm text-slate-700">المشروع: {r.project?.title}</p>
                          {r.message && <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">"{r.message}"</p>}
                          {r.status === "PENDING" && (
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" onClick={() => handleRequestDecision(r.id, "APPROVED")}><Check className="h-4 w-4 ml-1" /> قبول</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRequestDecision(r.id, "REJECTED")}><X className="h-4 w-4 ml-1" /> رفض</Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="outgoing" className="mt-4 space-y-3">
                    {outgoingRequests.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">لا توجد طلبات صادرة</p>
                    ) : (
                      outgoingRequests.map((r: any) => (
                        <div key={r.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{r.project?.title}</span>
                            <Badge variant={r.status === "PENDING" ? "secondary" : r.status === "APPROVED" ? "default" : r.status === "REJECTED" ? "destructive" : "outline"}>{r.status === "PENDING" ? "معلق" : r.status === "APPROVED" ? "مقبول" : r.status === "REJECTED" ? "مرفوض" : "ملغى"}</Badge>
                          </div>
                          {r.message && <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">"{r.message}"</p>}
                          {r.status === "PENDING" && (
                            <Button size="sm" variant="outline" onClick={() => handleRequestDecision(r.id, "CANCELED")}>إلغاء الطلب</Button>
                          )}
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          {recsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Card><CardContent className="p-6"><div className="h-24 bg-slate-100 rounded animate-pulse" /></CardContent></Card></div>
          ) : (
            <div className="space-y-6">
              {((recommendations.highPriority ?? []).length > 0) && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">أولوية عالية</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(recommendations.highPriority ?? []).map((item: any) => (
                      <Card key={item.project?.id} className="border-amber-200/80 bg-amber-50/30">
                        <CardContent className="p-4">
                          <Badge className="mb-2 bg-amber-500">موصى لك</Badge>
                          <h3 className="font-semibold text-slate-800">{item.project?.title}</h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.project?.summary}</p>
                          <Button size="sm" className="mt-3 w-full" onClick={() => openDetail(item.project?.id)}>عرض التفاصيل</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">موصى به</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(recommendations.recommended ?? []).map((item: any) => (
                    <Card key={item.project?.id} className="border-slate-100">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-800">{item.project?.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.project?.summary}</p>
                        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => openDetail(item.project?.id)}>عرض التفاصيل</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              {(recommendations.highPriority ?? []).length === 0 && (recommendations.recommended ?? []).length === 0 && (
                <Card className="border-slate-200"><CardContent className="py-12 text-center text-slate-500">لا توجد توصيات حالياً. أضف اهتماماتك ومهاراتك في الملف الشخصي</CardContent></Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Project Modal */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateFormErrors({}); setCreateOpen(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء مشروع جديد</DialogTitle>
            <DialogDescription>العنوان والملخص والوصف مطلوبة. الوسوم حد أقصى 12.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>العنوان * (5 أحرف على الأقل)</Label>
              <Input
                value={createForm.title}
                onChange={(e) => { setCreateForm((f) => ({ ...f, title: e.target.value })); setCreateFormErrors((er) => ({ ...er, title: undefined })); }}
                placeholder="عنوان المشروع"
                className={createFormErrors.title ? "border-red-500" : ""}
              />
              {createFormErrors.title && <p className="text-xs text-red-600 mt-1">{createFormErrors.title}</p>}
            </div>
            <div>
              <Label>ملخص * (20 حرفاً على الأقل)</Label>
              <Input
                value={createForm.summary}
                onChange={(e) => { setCreateForm((f) => ({ ...f, summary: e.target.value })); setCreateFormErrors((er) => ({ ...er, summary: undefined })); }}
                placeholder="ملخص قصير عن المشروع"
                className={createFormErrors.summary ? "border-red-500" : ""}
              />
              {createFormErrors.summary && <p className="text-xs text-red-600 mt-1">{createFormErrors.summary}</p>}
            </div>
            <div>
              <Label>الوصف *</Label>
              <textarea
                className={`w-full min-h-[88px] border rounded-md px-3 py-2 text-sm ${createFormErrors.description ? "border-red-500" : ""}`}
                value={createForm.description}
                onChange={(e) => { setCreateForm((f) => ({ ...f, description: e.target.value })); setCreateFormErrors((er) => ({ ...er, description: undefined })); }}
                placeholder="وصف تفصيلي للمشروع"
              />
              {createFormErrors.description && <p className="text-xs text-red-600 mt-1">{createFormErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الحالة</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={createForm.status} onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="DRAFT">مسودة</option>
                  <option value="OPEN">مفتوح</option>
                  <option value="IN_PROGRESS">قيد التنفيذ</option>
                </select>
              </div>
              <div>
                <Label>الظهور</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={createForm.visibility} onChange={(e) => setCreateForm((f) => ({ ...f, visibility: e.target.value }))}>
                  {Object.entries(VISIBILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>السعة (عدد الأعضاء الأقصى)</Label>
              <Input type="number" min={1} max={50} value={createForm.capacity} onChange={(e) => setCreateForm((f) => ({ ...f, capacity: Number(e.target.value) || 5 }))} />
            </div>
            {departments.length > 0 && (
              <div>
                <Label>القسم / الكلية</Label>
                <Select value={createForm.departmentId} onValueChange={(v) => setCreateForm((f) => ({ ...f, departmentId: v }))}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— لا شيء —</SelectItem>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>وسوم (حد أقصى 12)</Label>
              <div className="flex flex-wrap gap-2 mt-1 p-2 border rounded-md bg-slate-50/50 min-h-[44px]">
                {createForm.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button type="button" onClick={() => setCreateForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="hover:bg-slate-300 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {createForm.tags.length < 12 && (
                  <Input
                    placeholder="أضف وسم ثم Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "," || e.key === "،") {
                        e.preventDefault();
                        const v = (e.key === "Enter" ? tagInput : tagInput.replace(/[,،]$/, "")).trim();
                        if (v && createForm.tags.length < 12 && !createForm.tags.includes(v)) {
                          setCreateForm((f) => ({ ...f, tags: [...f.tags, v] }));
                          setTagInput("");
                          setCreateFormErrors((er) => ({ ...er, tags: undefined }));
                        }
                      }
                    }}
                    className="flex-1 min-w-[120px] border-0 bg-transparent shadow-none focus-visible:ring-0 h-8"
                  />
                )}
              </div>
              {(createFormErrors.tags || createForm.tags.length > 0) && <p className="text-xs text-slate-500 mt-1">{createForm.tags.length} / 12</p>}
              {createFormErrors.tags && <p className="text-xs text-red-600">{createFormErrors.tags}</p>}
            </div>
            <div>
              <Label>الأدوار المطلوبة</Label>
              <div className="flex flex-wrap gap-2 mt-1 p-2 border rounded-md bg-slate-50/50 min-h-[44px]">
                {createForm.requiredRoles.map((r) => (
                  <Badge key={r} variant="secondary" className="gap-1">
                    {r}
                    <button type="button" onClick={() => setCreateForm((f) => ({ ...f, requiredRoles: f.requiredRoles.filter((x) => x !== r) }))} className="hover:bg-slate-300 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                <Input
                  placeholder="مثل: مشرف مشارك، محلل بيانات ثم Enter"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "," || e.key === "،") {
                      e.preventDefault();
                      const v = (e.key === "Enter" ? roleInput : roleInput.replace(/[,،]$/, "")).trim();
                      if (v && !createForm.requiredRoles.includes(v)) {
                        setCreateForm((f) => ({ ...f, requiredRoles: [...f.requiredRoles, v] }));
                        setRoleInput("");
                      }
                    }
                  }}
                  className="flex-1 min-w-[140px] border-0 bg-transparent shadow-none focus-visible:ring-0 h-8"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createSaving}>{createSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null} إنشاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Request Modal */}
      <Dialog open={!!joinModalProjectId} onOpenChange={(open) => !open && setJoinModalProjectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>طلب انضمام</DialogTitle><DialogDescription>أضف رسالة قصيرة (اختياري)</DialogDescription></DialogHeader>
          <Input value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} placeholder="لماذا تريد الانضمام؟" className="mt-2" />
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setJoinModalProjectId(null)}>إلغاء</Button>
            <Button disabled={!!joiningId} onClick={() => joinModalProjectId && handleJoinRequest(joinModalProjectId)}>{joiningId ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />} إرسال</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Details Drawer (Sheet from right) */}
      <Sheet open={detailOpen} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {detailProject && (
            <>
              <SheetHeader className="text-right">
                <SheetTitle>{detailProject.title}</SheetTitle>
                <SheetDescription>{detailProject.summary}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-4 pr-4">
                {detailProject.description && <p className="text-sm text-slate-600">{detailProject.description}</p>}
                <div className="flex flex-wrap gap-2">
                  <Badge>{STATUS_LABELS[detailProject.status]}</Badge>
                  <Badge variant="outline">{VISIBILITY_LABELS[detailProject.visibility]}</Badge>
                  <span className="text-sm text-slate-500">{detailProject._count?.members ?? detailProject.members?.length ?? 0} / {detailProject.capacity ?? 0} عضو</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(detailProject.tags ?? []).map((t: { tag: string }) => (
                    <span key={t.tag} className="text-xs bg-slate-100 px-2 py-0.5 rounded">{t.tag}</span>
                  ))}
                </div>
                {(detailProject.requiredRoles ?? []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1"><Briefcase className="h-4 w-4" /> الأدوار المطلوبة</h4>
                    <p className="text-sm text-slate-600 mt-1">{(detailProject.requiredRoles ?? []).join("، ")}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1"><Users className="h-4 w-4" /> الأعضاء</h4>
                  <ul className="mt-2 space-y-1">
                    {(detailProject.members ?? []).map((m: any) => (
                      <li key={m.researcherId} className="flex items-center gap-2 text-sm">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          {(m.researcher?.fullNameAr || m.researcher?.fullNameEn || "?").slice(0, 1)}
                        </div>
                        <span>{m.researcher?.fullNameAr || m.researcher?.fullNameEn}</span>
                        <Badge variant="secondary" className="text-xs">{m.role === "OWNER" ? "مالك" : m.role === "CO_LEAD" ? "قائد مشارك" : "عضو"}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
                {(detailProject.joinRequests ?? []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700">طلبات الانضمام</h4>
                    <ul className="mt-2 space-y-2">
                      {(detailProject.joinRequests ?? []).map((r: any) => (
                        <li key={r.id} className="flex items-center justify-between gap-2 text-sm border rounded p-2">
                          <span>{r.requester?.fullNameAr || r.requester?.fullNameEn}</span>
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleRequestDecision(r.id, "APPROVED")}><Check className="h-4 w-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRequestDecision(r.id, "REJECTED")}><X className="h-4 w-4" /></Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {((detailProject._count?.members ?? detailProject.members?.length ?? 0) < (detailProject.capacity ?? 0)) && (
                  <div>
                    <Label>طلب انضمام</Label>
                    <Input value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} placeholder="رسالة (اختياري)" className="mt-1" />
                    <Button className="w-full mt-2" disabled={!!joiningId} onClick={() => handleJoinRequest(detailProject.id)}>{joiningId ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />} طلب الانضمام</Button>
                  </div>
                )}
                {(detailProject as any).ownerId === currentUserId && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {detailProject.status === "OPEN" && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(detailProject.id, "IN_PROGRESS")}><Play className="h-4 w-4 ml-2" /> بدء التنفيذ</Button>}
                    {detailProject.status === "IN_PROGRESS" && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(detailProject.id, "COMPLETED")}><CheckCircle2 className="h-4 w-4 ml-2" /> تحديد مكتمل</Button>}
                    {(detailProject.status === "OPEN" || detailProject.status === "IN_PROGRESS") && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(detailProject.id, "ARCHIVED")}><Lock className="h-4 w-4 ml-2" /> أرشفة</Button>}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* عرض ملف الباحث (من باحثون متاحون / باحثون مناسبون) */}
      <Sheet open={researcherDetailOpen} onOpenChange={(open) => { if (!open) setSelectedResearcher(null); setResearcherDetailOpen(open); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selectedResearcher && (
            <>
              <SheetHeader className="text-right">
                <SheetTitle>ملف الباحث</SheetTitle>
                <SheetDescription>معلومات عامة للتعاون</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 pr-2">
                <div className="flex justify-center">
                  {selectedResearcher.avatarUrl ? (
                    <img src={selectedResearcher.avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-semibold text-slate-500">
                      {(selectedResearcher.fullNameAr || selectedResearcher.fullNameEn || "?")[0]}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 text-center">{selectedResearcher.fullNameAr || selectedResearcher.fullNameEn || "—"}</h3>
                {selectedResearcher.college && <p className="text-sm text-slate-600"><span className="font-medium">الكلية / القسم:</span> {selectedResearcher.college}</p>}
                {(selectedResearcher.specialization || selectedResearcher.headline) && (
                  <p className="text-sm text-slate-600"><span className="font-medium">التخصص / الاهتمام:</span> {selectedResearcher.headline || selectedResearcher.specialization}</p>
                )}
                <p className="text-sm text-slate-600"><span className="font-medium">عدد البحوث:</span> {selectedResearcher.researchCount ?? 0}</p>
                {selectedResearcher.availabilityStatus && (
                  <Badge variant="secondary">{AVAILABILITY_LABELS[selectedResearcher.availabilityStatus] ?? selectedResearcher.availabilityStatus}</Badge>
                )}
                {selectedResearcher.scorePercent != null && (
                  <Badge className="bg-emerald-100 text-emerald-800">متوافق بنسبة {selectedResearcher.scorePercent}%</Badge>
                )}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setResearcherDetailOpen(false)}>إغلاق</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => { showToast("دعوة للمشروع قريباً", "success"); setResearcherDetailOpen(false); }}>دعوة لمشروع</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* عرض الكل — باحثون متاحون */}
      <Sheet open={allResearchersOpen} onOpenChange={setAllResearchersOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="text-right">
            <SheetTitle>باحثون متاحون للتعاون</SheetTitle>
            <SheetDescription>اعرض الملف أو ادعُ أي باحث لمشروعك</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 mt-4 pr-2">
            {availableResearchers.map((r: any) => (
              <Card key={r.id} className="border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
                <CardContent className="p-2.5">
                  <div className="flex items-center gap-2">
                    {r.avatarUrl ? (
                      <img src={r.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold shrink-0">
                        {(r.fullNameAr || r.fullNameEn || "?")[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-slate-800 text-xs truncate">{r.fullNameAr || r.fullNameEn || "—"}</h4>
                      {r.college && <p className="text-[10px] text-slate-500 truncate">{r.college}</p>}
                    </div>
                  </div>
                  {r.specialization && <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">{r.specialization}</p>}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">{r.researchCount ?? 0} بحث</span>
                    {r.availabilityStatus && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{AVAILABILITY_LABELS[r.availabilityStatus] ?? r.availabilityStatus}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] px-1.5" onClick={() => { setSelectedResearcher(r); setResearcherDetailOpen(true); setAllResearchersOpen(false); }}>عرض الملف</Button>
                    <Button size="sm" className="flex-1 h-7 text-[10px] px-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => showToast("دعوة للمشروع قريباً", "success")}>دعوة</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
