"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "./KpiCard";
import {
  BookOpen,
  FileCheck,
  CheckCircle2,
  XCircle,
  Globe,
  MapPin,
  User,
  Database,
  Presentation,
  Users,
  GraduationCap,
  Wrench,
  ClipboardList,
  BookOpen as BookIcon,
  Award,
  FileText,
  UserCheck,
  Briefcase,
  Calendar,
  Heart,
} from "lucide-react";

interface StatsSectionProps {
  title: string;
  description: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "outline";
  };
  subsections: Array<{
    title: string;
    kpis: Array<{
      label: string;
      value: string;
      icon?: any;
      color?: string;
    }>;
  }>;
  variant?: "lifetime" | "filtered";
}

const researchKpiConfig = [
  { label: "إجمالي البحوث", icon: BookOpen, color: "bg-blue-500" },
  { label: "البحوث المخططة", icon: FileCheck, color: "bg-yellow-500" },
  { label: "البحوث المنجزة", icon: CheckCircle2, color: "bg-green-500" },
  { label: "البحوث المنشورة", icon: FileCheck, color: "bg-purple-500" },
  { label: "البحوث غير المنجزة", icon: XCircle, color: "bg-red-500" },
  { label: "البحوث العالمية", icon: Globe, color: "bg-indigo-500" },
  { label: "البحوث المحلية", icon: MapPin, color: "bg-orange-500" },
  { label: "البحوث المفردة", icon: User, color: "bg-teal-500" },
  { label: "Scopus", icon: Database, color: "bg-cyan-500" },
  { label: "Thomson Reuters", icon: Database, color: "bg-amber-500" },
];

export function StatsSection({
  title,
  description,
  badge,
  subsections,
  variant = "lifetime",
}: StatsSectionProps) {
  const borderColor = variant === "lifetime" 
    ? "border-l-4 border-l-blue-500" 
    : "border-l-4 border-l-[#2563EB]";

  return (
    <Card className={`border-slate-100 bg-white shadow-lg ${borderColor}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-gray-900 mb-1">
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              {description}
            </CardDescription>
          </div>
          {badge && (
            <Badge
              variant={badge.variant || "secondary"}
              className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-xs font-medium"
            >
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {subsections.map((subsection, index) => (
          <div key={index}>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {subsection.title}
            </h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {subsection.kpis.map((kpi, kpiIndex) => {
                // For research KPIs, use the config
                if (kpiIndex < researchKpiConfig.length) {
                  const config = researchKpiConfig[kpiIndex];
                  const Icon = config.icon;
                  return (
                    <KpiCard
                      key={kpi.label}
                      label={kpi.label}
                      value={kpi.value}
                      icon={Icon}
                      color={config.color}
                    />
                  );
                }
                // For academic activities, use provided icon and color
                const Icon = kpi.icon || BookOpen;
                const color = kpi.color || "bg-gray-500";
                return (
                  <KpiCard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                    icon={Icon}
                    color={color}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
