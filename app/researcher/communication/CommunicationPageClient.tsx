"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MessageCircle,
  Send,
  Loader2,
  Users,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type {
  ConversationListItem,
  DirectoryPageResult,
  DirectoryResearcher,
  ThreadMessage,
} from "@/lib/communicationRepo";

type FiltersPayload = {
  colleges: string[];
  departments: string[];
  specializations: string[];
};

type CommunicationPageClientProps = {
  currentUserId: string;
  initialFilters: FiltersPayload;
  initialDirectory: DirectoryPageResult;
  initialConversations: ConversationListItem[];
  initialConversationId?: string | null;
};

type PanelView = "conversations" | "researchers";

const thinScroll =
  "[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.28)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/30 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/50 [&::-webkit-scrollbar-button]:hidden";

function AvatarBubble({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [failed, setFailed] = useState(false);
  const box =
    size === "xl"
      ? "h-11 w-11 text-xs"
      : size === "lg"
        ? "h-[42px] w-[42px] text-xs"
        : size === "sm"
          ? "h-9 w-9 text-[11px]"
          : "h-10 w-10 text-xs";
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  if (src && !failed) {
    return (
      <div className={`relative ${box} rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0`}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={
            size === "xl" ? "44px" : size === "lg" ? "42px" : size === "sm" ? "36px" : "40px"
          }
          unoptimized
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${box} rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold border border-blue-100 shrink-0`}
    >
      {initials || "ب"}
    </div>
  );
}

function formatTime(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ar-IQ", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatMessageTime(value: string | null | undefined) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.round(
      (startOfToday.getTime() - startOfMsg.getTime()) / 86_400_000
    );
    const time = date.toLocaleTimeString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (dayDiff === 0) return time;
    if (dayDiff === 1) return `أمس، ${time}`;
    return `${date.toLocaleDateString("ar-IQ", {
      month: "short",
      day: "numeric",
    })}، ${time}`;
  } catch {
    return "";
  }
}

function formatInboxTime(value: string | null | undefined) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return date.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
    }
    return formatTime(value);
  } catch {
    return "";
  }
}

const workspaceShell =
  "rounded-[20px] border border-slate-200/70 bg-white shadow-sm overflow-hidden flex flex-col min-h-0";

const listPanelShell =
  "flex flex-col min-h-0 min-w-0 h-full bg-white border-b lg:border-b-0 lg:border-e border-slate-200/70";

const conversationPanelShell = "flex flex-col min-h-0 min-w-0 h-full bg-white";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200";

export function CommunicationPageClient({
  initialFilters,
  initialDirectory,
  initialConversations,
  initialConversationId = null,
}: CommunicationPageClientProps) {
  const searchParams = useSearchParams();
  const [mobileTab, setMobileTab] = useState<"directory" | "messages">("directory");
  const [panelView, setPanelView] = useState<PanelView>("conversations");
  const [q, setQ] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [college, setCollege] = useState("all");
  const [department, setDepartment] = useState("all");
  const [specialization, setSpecialization] = useState("all");
  const [page, setPage] = useState(initialDirectory.page);
  const [filters] = useState(initialFilters);
  const [researchers, setResearchers] = useState(initialDirectory.researchers);
  const [directoryTotal, setDirectoryTotal] = useState(initialDirectory.total);
  const [totalPages, setTotalPages] = useState(initialDirectory.totalPages);
  const [pageSize] = useState(initialDirectory.pageSize);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || searchParams.get("conversation")
  );
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [composePeer, setComposePeer] = useState<DirectoryResearcher | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const directoryListRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const activePeerDirectory = useMemo(() => {
    if (composePeer) return composePeer;
    if (!activeConversation) return null;
    return researchers.find((r) => r.id === activeConversation.peer.id) ?? null;
  }, [composePeer, activeConversation, researchers]);

  const filteredConversations = useMemo(() => {
    const term = conversationQuery.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => {
      const name = conversation.peer.fullName?.toLowerCase() ?? "";
      const title = conversation.peer.academicTitle?.toLowerCase() ?? "";
      const last = conversation.lastMessage?.body?.toLowerCase() ?? "";
      return name.includes(term) || title.includes(term) || last.includes(term);
    });
  }, [conversations, conversationQuery]);

  const refreshDirectory = useCallback(async () => {
    setLoadingDirectory(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (college !== "all") params.set("college", college);
      if (department !== "all") params.set("department", department);
      if (specialization !== "all") params.set("specialization", specialization);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/researcher/communication/directory?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("تعذر تحميل الدليل");
      const json = (await res.json()) as DirectoryPageResult;
      setResearchers(json.researchers ?? []);
      setDirectoryTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
      if (json.page && json.page !== page) setPage(json.page);
      directoryListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoadingDirectory(false);
    }
  }, [q, college, department, specialization, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [q, college, department, specialization]);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/researcher/communication/conversations", {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      setConversations(json.conversations ?? []);
    } catch {
      // ignore
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      setLoadingThread(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/researcher/communication/conversations/${conversationId}/messages`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("تعذر تحميل الرسائل");
        const json = await res.json();
        setMessages(json.messages ?? []);
        await refreshConversations();
      } catch (e) {
        setError(e instanceof Error ? e.message : "حدث خطأ");
      } finally {
        setLoadingThread(false);
      }
    },
    [refreshConversations]
  );

  useEffect(() => {
    if (initialConversationId || searchParams.get("conversation")) {
      setMobileTab("messages");
    }
  }, [initialConversationId, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshDirectory();
    }, 250);
    return () => clearTimeout(timer);
  }, [refreshDirectory]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    void loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    const timer = setInterval(() => {
      void loadMessages(activeConversationId);
    }, 20000);
    return () => clearInterval(timer);
  }, [activeConversationId, loadMessages]);

  const openConversation = async (peer: DirectoryResearcher) => {
    setComposePeer(peer);
    setMobileTab("messages");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/researcher/communication/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: peer.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "تعذر فتح المحادثة");
      }
      const json = await res.json();
      setActiveConversationId(json.conversationId);
      await refreshConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeConversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/researcher/communication/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "تعذر إرسال الرسالة");
      }
      const json = await res.json();
      setDraft("");
      if (json.message) {
        setMessages((prev) => [...prev, json.message]);
      } else {
        await loadMessages(activeConversationId);
      }
      await refreshConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setComposePeer(null);
    setMobileTab("messages");
  };

  const activePeerName =
    activeConversation?.peer.fullName ?? composePeer?.fullName ?? null;
  const activePeerTitle =
    activeConversation?.peer.academicTitle ?? composePeer?.academicTitle ?? null;
  const activePeerSubtitle = (() => {
    if (activePeerDirectory) {
      return (
        [
          activePeerDirectory.academicTitle,
          activePeerDirectory.departmentName !== "غير محدد"
            ? activePeerDirectory.departmentName
            : null,
          activePeerDirectory.specialization,
          activePeerDirectory.collegeName !== "غير محدد"
            ? activePeerDirectory.collegeName
            : null,
        ]
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .slice(0, 2)
          .join(" · ") || null
      );
    }
    return activePeerTitle;
  })();

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const researcherSubtitle = (researcher: DirectoryResearcher) =>
    [
      researcher.academicTitle,
      researcher.departmentName !== "غير محدد" ? researcher.departmentName : null,
      !researcher.departmentName || researcher.departmentName === "غير محدد"
        ? researcher.specialization
        : null,
      !researcher.departmentName || researcher.departmentName === "غير محدد"
        ? researcher.collegeName !== "غير محدد"
          ? researcher.collegeName
          : null
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-slate-900">التواصل</h1>
        <p className="mt-1 text-sm text-slate-500">
          تواصل مباشرة مع باحثي جامعة البصرة وتابع محادثاتك الأكاديمية.
        </p>
      </div>

      <div className="flex gap-2 lg:hidden shrink-0">
        <Button
          type="button"
          variant={mobileTab === "directory" ? "default" : "outline"}
          className={`h-9 rounded-xl flex-1 ${focusRing} ${mobileTab === "directory" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : ""}`}
          onClick={() => setMobileTab("directory")}
        >
          القائمة
        </Button>
        <Button
          type="button"
          variant={mobileTab === "messages" ? "default" : "outline"}
          className={`h-9 rounded-xl flex-1 ${focusRing} ${mobileTab === "messages" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : ""}`}
          onClick={() => setMobileTab("messages")}
        >
          المحادثة
          {unreadTotal > 0 ? (
            <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] text-white">
              {unreadTotal}
            </span>
          ) : null}
        </Button>
      </div>

      {error ? (
        <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div
        className={`${workspaceShell} min-h-[560px] lg:min-h-[620px] h-[calc(100vh-190px)] max-h-[calc(100vh-160px)]`}
      >
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(320px,min(34%,440px))_minmax(0,1fr)]">
          <section
            className={`${listPanelShell} ${
              mobileTab === "directory" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="shrink-0 border-b border-slate-100 px-3 pt-2.5 pb-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <h2 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  المحادثات
                </h2>
                {conversations.length > 0 ? (
                  <span className="text-[11px] text-slate-400">
                    {conversations.length.toLocaleString("ar-IQ")}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100/70 p-1">
                <button
                  type="button"
                  onClick={() => setPanelView("conversations")}
                  className={`h-9 rounded-[10px] text-[13px] font-medium transition-all duration-150 ${focusRing} ${
                    panelView === "conversations"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  المحادثات
                </button>
                <button
                  type="button"
                  onClick={() => setPanelView("researchers")}
                  className={`h-9 rounded-[10px] text-[13px] font-medium transition-all duration-150 ${focusRing} ${
                    panelView === "researchers"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  الباحثون
                </button>
              </div>

              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                {panelView === "conversations" ? (
                  <Input
                    value={conversationQuery}
                    onChange={(e) => setConversationQuery(e.target.value)}
                    placeholder="ابحث في المحادثات..."
                    className={`h-10 rounded-xl pr-9 border-slate-200 bg-white ${focusRing}`}
                  />
                ) : (
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ابحث عن باحث بالاسم أو اللقب..."
                    className={`h-10 rounded-xl pr-9 border-slate-200 bg-white ${focusRing}`}
                  />
                )}
              </div>

              {panelView === "researchers" ? (
                <div className="grid grid-cols-3 gap-1.5">
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className={`h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 truncate ${focusRing}`}
                  >
                    <option value="all">كل الكليات</option>
                    {filters.colleges.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 truncate ${focusRing}`}
                  >
                    <option value="all">كل الأقسام</option>
                    {filters.departments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className={`h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 truncate ${focusRing}`}
                  >
                    <option value="all">كل التخصصات</option>
                    {filters.specializations.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div
              ref={directoryListRef}
              className={`flex-1 overflow-y-auto min-h-0 ${thinScroll}`}
            >
              {panelView === "conversations" ? (
                filteredConversations.length === 0 ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center px-6 text-center gap-2.5">
                    <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[15px] font-semibold text-slate-800">لا توجد محادثات بعد</p>
                      <p className="text-[13px] text-slate-500 leading-relaxed">
                        {conversationQuery.trim()
                          ? "لا توجد نتائج مطابقة لبحثك في المحادثات."
                          : "ابدأ بالتواصل مع أحد الباحثين من دليل الباحثين."}
                      </p>
                    </div>
                    {!conversationQuery.trim() ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={`h-8 rounded-lg text-xs border-slate-200 ${focusRing}`}
                        onClick={() => setPanelView("researchers")}
                      >
                        استعرض الباحثين
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div>
                    {filteredConversations.map((conversation) => {
                      const active = conversation.id === activeConversationId;
                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => selectConversation(conversation.id)}
                          className={`relative w-full text-right px-3 pe-3.5 py-2.5 min-h-[70px] border-b border-slate-100 transition-colors duration-150 ${focusRing} ${
                            active ? "bg-blue-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          {active ? (
                            <span className="absolute top-2 bottom-2 start-0 w-[2.5px] rounded-full bg-[#2563EB]" />
                          ) : null}
                          <div className="flex items-start gap-2.5">
                            <AvatarBubble
                              name={conversation.peer.fullName}
                              src={conversation.peer.avatarUrl}
                              size="lg"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {conversation.peer.fullName}
                                </p>
                                <span className="text-[11px] text-slate-400 shrink-0">
                                  {formatInboxTime(
                                    conversation.lastMessageAt ||
                                      conversation.lastMessage?.createdAt
                                  )}
                                </span>
                              </div>
                              {conversation.peer.academicTitle ? (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {conversation.peer.academicTitle}
                                </p>
                              ) : null}
                              <div className="flex items-center gap-2 mt-0.5 min-w-0">
                                <p className="text-xs text-slate-500 truncate min-w-0 flex-1 text-start">
                                  {conversation.lastMessage?.body || "بدون رسائل بعد"}
                                </p>
                                {conversation.unreadCount > 0 ? (
                                  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] font-semibold text-white shrink-0 ms-0.5">
                                    {conversation.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : loadingDirectory ? (
                <div className="min-h-[200px] flex items-center justify-center py-12 text-slate-500 gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحديث...
                </div>
              ) : researchers.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center px-6 text-center gap-2.5">
                  <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[15px] font-semibold text-slate-800">لم يتم العثور على باحثين</p>
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                      جرّب تغيير كلمات البحث أو عوامل التصفية.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {researchers.map((researcher) => (
                    <button
                      key={researcher.id}
                      type="button"
                      disabled={sending}
                      onClick={() => void openConversation(researcher)}
                      className={`relative w-full text-right px-3 py-2.5 min-h-[70px] border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-60 ${focusRing}`}
                    >
                      <div className="flex items-center gap-2.5 pe-1">
                        <AvatarBubble
                          name={researcher.fullName}
                          src={researcher.avatarUrl}
                          size="lg"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {researcher.fullName}
                            </p>
                            {researcher.sameCollege ? (
                              <span className="shrink-0 rounded bg-blue-50 px-1 py-0.5 text-[9px] font-medium text-blue-700">
                                كليتي
                              </span>
                            ) : null}
                            {researcher.sameDepartment ? (
                              <span className="shrink-0 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-medium text-emerald-700">
                                قسمي
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {researcherSubtitle(researcher) || "بيانات أكاديمية غير مكتملة"}
                          </p>
                        </div>
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 shrink-0 transition-colors duration-150"
                          title="مراسلة"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {panelView === "researchers" && directoryTotal > 0 ? (
              <div className="shrink-0 h-11 border-t border-slate-100 px-3 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400">
                  {((page - 1) * pageSize + 1).toLocaleString("ar-IQ")}–
                  {Math.min(page * pageSize, directoryTotal).toLocaleString("ar-IQ")} من{" "}
                  {directoryTotal.toLocaleString("ar-IQ")}
                </p>
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-md ${focusRing}`}
                    disabled={page <= 1 || loadingDirectory}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    title="الصفحة السابقة"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] text-slate-500 min-w-[3.25rem] text-center">
                    {page.toLocaleString("ar-IQ")} / {totalPages.toLocaleString("ar-IQ")}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-md ${focusRing}`}
                    disabled={page >= totalPages || loadingDirectory}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    title="الصفحة التالية"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section
            className={`${conversationPanelShell} ${
              mobileTab === "messages" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="flex flex-col h-full min-h-0 min-w-0">
              {activeConversationId && activePeerName ? (
                <div className="shrink-0 h-[72px] px-4 sm:px-5 lg:px-6 border-b border-slate-200/70 bg-white flex items-center gap-2">
                  <button
                    type="button"
                    className={`lg:hidden inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 shrink-0 ${focusRing}`}
                    onClick={() => setMobileTab("directory")}
                  >
                    <ChevronRight className="h-4 w-4" />
                    المحادثات
                  </button>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {activeConversation ? (
                      <AvatarBubble
                        name={activeConversation.peer.fullName}
                        src={activeConversation.peer.avatarUrl}
                        size="xl"
                      />
                    ) : composePeer ? (
                      <AvatarBubble
                        name={composePeer.fullName}
                        src={composePeer.avatarUrl}
                        size="xl"
                      />
                    ) : null}
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="text-[15px] font-semibold text-slate-900 truncate leading-snug">
                        {activePeerName}
                      </p>
                      {activePeerSubtitle ? (
                        <p className="text-xs text-slate-500 truncate mt-0.5 leading-snug">
                          {activePeerSubtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div
                className={`flex-1 min-h-0 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 bg-slate-50/40 ${thinScroll}`}
              >
                {!activeConversationId ? (
                  <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6 gap-3">
                    <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
                      <MessageSquare className="h-7 w-7 text-blue-500" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <p className="text-[17px] font-semibold text-slate-800">ابدأ محادثة جديدة</p>
                      <p className="text-[13px] text-slate-500 leading-relaxed">
                        اختر محادثة من القائمة أو ابحث عن باحث لبدء التواصل الأكاديمي.
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                        المراسلات داخل واحة الباحث مخصصة للتواصل العلمي والأكاديمي.
                      </p>
                    </div>
                  </div>
                ) : loadingThread ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <p className="text-xs text-slate-400">جاري تحميل الرسائل...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-6 gap-2.5">
                    {activeConversation ? (
                      <AvatarBubble
                        name={activeConversation.peer.fullName}
                        src={activeConversation.peer.avatarUrl}
                        size="lg"
                      />
                    ) : composePeer ? (
                      <AvatarBubble
                        name={composePeer.fullName}
                        src={composePeer.avatarUrl}
                        size="lg"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-blue-500" />
                      </div>
                    )}
                    <div className="space-y-1.5 max-w-sm">
                      <p className="text-[17px] font-semibold text-slate-800">
                        ابدأ المحادثة مع {activePeerName}
                      </p>
                      <p className="text-[13px] text-slate-500 leading-relaxed">
                        أرسل أول رسالة لبدء التواصل حول موضوعك الأكاديمي أو البحثي.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-start gap-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex w-full ${message.isMine ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`flex flex-col max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] min-w-0 ${
                            message.isMine ? "items-start" : "items-end"
                          }`}
                        >
                          <div
                            className={`px-4 py-2 text-sm leading-snug text-right shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
                              message.isMine
                                ? "bg-[#2563EB] text-white rounded-2xl rounded-tr-md"
                                : "bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-tl-md"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                              {message.body}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-[3px] px-1 leading-none">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="shrink-0 border-t border-slate-100 bg-white px-2 py-2 sm:px-3 sm:py-2.5">
                <div
                  className={`flex items-end gap-2 min-h-[48px] rounded-2xl border border-slate-200 px-1.5 py-1.5 transition-all duration-150 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100/60 ${
                    activeConversationId ? "bg-slate-50/50" : "bg-slate-50/60 opacity-80"
                  }`}
                >
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={1}
                    disabled={!activeConversationId || sending}
                    placeholder={
                      activeConversationId ? "اكتب رسالتك..." : "اختر محادثة للبدء"
                    }
                    className="flex-1 min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:bg-transparent disabled:text-slate-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={!activeConversationId || !draft.trim() || sending}
                    className={`h-10 w-10 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-100 disabled:text-white/80 disabled:opacity-100 p-0 shrink-0 shadow-sm ${focusRing}`}
                  >
                    {sending ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin text-white" />
                    ) : (
                      <Send className="h-[18px] w-[18px]" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
