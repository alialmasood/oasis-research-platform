"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Languages, Plus, X } from "lucide-react";
import { LanguageDialog } from "./LanguageDialog";
import { deleteLanguage } from "../_actions";
import type { Language } from "@prisma/client";

interface LanguagesCardProps {
  languages: Language[];
}

const levelLabels: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
  NATIVE: "طليق",
};

const levelColors: Record<string, string> = {
  BEGINNER: "bg-blue-100 text-blue-700 border-blue-200",
  INTERMEDIATE: "bg-green-100 text-green-700 border-green-200",
  ADVANCED: "bg-purple-100 text-purple-700 border-purple-200",
  NATIVE: "bg-orange-100 text-orange-700 border-orange-200",
};

export function LanguagesCard({ languages }: LanguagesCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenDialog = (language?: Language) => {
    setEditingLanguage(language || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLanguage(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه اللغة؟")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteLanguage(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "حدث خطأ أثناء حذف اللغة");
      }
    });
  };

  return (
    <>
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Languages className="h-5 w-5 text-blue-600" />
              اللغات
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDialog()}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <div
                  key={language.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/70 text-sm group hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{language.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${levelColors[language.level] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                  >
                    {levelLabels[language.level] || language.level}
                  </Badge>
                  <button
                    onClick={() => handleDelete(language.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 ml-1"
                    title="حذف"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">لا توجد لغات مضافة</p>
          )}
        </CardContent>
      </Card>

      <LanguageDialog
        key={editingLanguage?.id || "new"}
        isOpen={isDialogOpen}
        onCloseAction={handleCloseDialog}
        editingLanguage={editingLanguage}
        isPending={isPending}
      />
    </>
  );
}
