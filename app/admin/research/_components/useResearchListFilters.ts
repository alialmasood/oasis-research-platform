"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  buildResearchListUrl,
  ADMIN_RESEARCH_SECTIONS,
  type AdminResearchSection,
} from "@/lib/admin/researchListUrl";
import type { AdminResearchPageData } from "@/lib/admin/researchTypes";

export function useResearchListFilters(
  data: AdminResearchPageData,
  section: AdminResearchSection = "overview"
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(data.filters.search);
  const sectionMeta = ADMIN_RESEARCH_SECTIONS[section];
  const fixedCategory = sectionMeta.fixedCategory;

  const listUrl = (patch: Partial<typeof data.filters> & { page?: number }) =>
    buildResearchListUrl({ ...data.filters, ...patch }, section);

  useEffect(() => {
    setSearchInput(data.filters.search);
  }, [data.filters.search]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === data.filters.search.trim()) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(listUrl({ search: trimmed, page: 1 }));
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, data.filters, router, section]);

  const navigate = (patch: Partial<typeof data.filters> & { page?: number }) => {
    startTransition(() => {
      router.push(listUrl(patch));
    });
  };

  const hasActiveFilters =
    data.filters.search.trim() !== "" ||
    data.filters.period !== "all" ||
    !!data.filters.status ||
    !!data.filters.publishStatus ||
    !!data.filters.researchType ||
    !!data.filters.year ||
    !!data.filters.entity ||
    (!fixedCategory && !!data.filters.category) ||
    !!data.filters.publishType ||
    !!data.filters.scopusQuartile;

  const resetFilters = () => {
    setSearchInput("");
    startTransition(() => router.push(sectionMeta.basePath));
  };

  return {
    isPending,
    searchInput,
    setSearchInput,
    navigate,
    hasActiveFilters,
    resetFilters,
    fixedCategory,
    sectionMeta,
  };
}
