import type { Granularity } from "@/lib/utils/dateBuckets";

export type AnalyticsEventType = "research" | "conference" | "workshop" | "committee";

export type UnifiedEvent = {
  date: Date;
  type: AnalyticsEventType;
  venue?: string;
  scope?: "local" | "regional" | "international";
  published?: boolean;
};

export type AnalyticsFilters = {
  from: Date;
  to: Date;
  granularity: Granularity;
  compareFrom?: Date;
  compareTo?: Date;
};

export type AnalyticsTimelinePoint = {
  key: string;
  label: string;
  total: number;
  research: number;
  researchPublished: number;
  conference: number;
  workshop: number;
  committee: number;
  activitiesCore: number;
};

export type AnalyticsKpis = {
  total: number;
  research: number;
  researchPublished: number;
  conference: number;
  workshop: number;
  committee: number;
  monthlyRate: number;
  bestPeriodLabel: string;
  growthPct: number;
};

export type AnalyticsHeatmapCell = {
  key: string;
  label: string;
  value: number;
};

export type AnalyticsPublications = {
  topVenues: Array<{ name: string; value: number }>;
  scopeShares: Array<{ name: string; value: number }>;
  yearly: Array<{ year: number; count: number }>;
  averagePerYear: number;
  peakYears: number[];
};

export type AnalyticsConferences = {
  yearly: Array<{ year: number; count: number }>;
  scopeShares: Array<{ name: string; value: number }>;
  participationShares: Array<{ name: string; value: number }>;
};

export type AnalyticsPerformance = {
  yearly: Array<{ year: number; count: number; average: number }>;
  totalActivities: number;
  yearsCount: number;
  averagePerYear: number;
  bestYear?: { year: number; count: number };
  worstYear?: { year: number; count: number };
};

export type AnalyticsComparison = {
  delta: {
    total: number;
    research: number;
    conference: number;
    workshop: number;
    committee: number;
  };
  timeline: {
    current: AnalyticsTimelinePoint[];
    previous: AnalyticsTimelinePoint[];
  };
};

export type AnalyticsInsights = {
  growthText: string;
  warningText: string;
  highlightText: string;
  recommendations: string[];
};

export type AnalyticsPayload = {
  timeline: AnalyticsTimelinePoint[];
  kpis: AnalyticsKpis;
  heatmap: AnalyticsHeatmapCell[];
  publications: AnalyticsPublications;
  conferences: AnalyticsConferences;
  performance: AnalyticsPerformance;
  compare?: AnalyticsComparison;
  insights: AnalyticsInsights;
};
