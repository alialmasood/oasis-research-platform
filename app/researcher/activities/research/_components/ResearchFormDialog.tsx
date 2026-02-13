"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ResearchFormFields } from "./ResearchFormFields";
import type { Research } from "@prisma/client";

interface ResearchFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  editingResearch: Research | null;
  isPending: boolean;
}

const initialFormData = {
  title: "",
  researchType: "PLANNED",
  ownership: "INDIVIDUAL",
  status: "IN_PROGRESS",
  progressPercent: "",
  year: new Date().getFullYear().toString(),
  publishStatus: "",
  researchUrl: "",
  publishType: "",
  publisher: "",
  doi: "",
  publishMonth: "",
  downloadUrl: "",
  categories: [] as string[],
  scopusQuartile: "",
};

export function ResearchFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editingResearch,
  isPending,
}: ResearchFormDialogProps) {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (editingResearch) {
      setFormData({
        title: editingResearch.title,
        researchType: editingResearch.researchType,
        ownership: editingResearch.ownership,
        status: editingResearch.status,
        progressPercent: editingResearch.progressPercent?.toString() ?? "",
        year: editingResearch.year.toString(),
        publishStatus: editingResearch.publishStatus ?? "",
        researchUrl: editingResearch.researchUrl ?? "",
        publishType: editingResearch.publishType ?? "",
        publisher: editingResearch.publisher ?? "",
        doi: editingResearch.doi ?? "",
        publishMonth: editingResearch.publishMonth?.toString() ?? "",
        downloadUrl: editingResearch.downloadUrl ?? "",
        categories: editingResearch.categories,
        scopusQuartile: editingResearch.scopusQuartile ?? "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingResearch, isOpen]);

  const handleFieldChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "status" && value === "IN_PROGRESS") {
      setFormData((prev) => ({
        ...prev,
        publishStatus: "",
        researchUrl: "",
        publishType: "",
        publisher: "",
        doi: "",
        publishMonth: "",
        downloadUrl: "",
        categories: [],
        scopusQuartile: "",
      }));
    }
    if (field === "publishStatus" && value !== "PUBLISHED") {
      setFormData((prev) => ({
        ...prev,
        researchUrl: "",
        publishType: "",
        publisher: "",
        doi: "",
        publishMonth: "",
        downloadUrl: "",
        categories: [],
        scopusQuartile: "",
      }));
    }
    if (field === "categories" && !(value as string[]).includes("SCOPUS")) {
      setFormData((prev) => ({ ...prev, scopusQuartile: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      title: formData.title,
      researchType: formData.researchType,
      ownership: formData.ownership,
      status: formData.status,
      year: parseInt(formData.year),
      categories: Array.isArray(formData.categories) ? formData.categories : [], // تأكد من أن categories دائماً array
    };

    if (formData.status === "IN_PROGRESS") {
      payload.progressPercent = formData.progressPercent ? parseInt(formData.progressPercent) : null;
    }

    if (formData.status === "COMPLETED") {
      payload.publishStatus = formData.publishStatus || null;
      if (formData.publishStatus === "PUBLISHED") {
        payload.researchUrl = formData.researchUrl || null;
        payload.publishType = formData.publishType || null;
        payload.publisher = formData.publisher || null;
        payload.doi = formData.doi || null;
        payload.publishMonth = formData.publishMonth ? parseInt(formData.publishMonth) : null;
        payload.downloadUrl = formData.downloadUrl || null;
        // التصنيفات مطلوبة فقط عند النشر
        payload.categories = Array.isArray(formData.categories) ? formData.categories : [];
        // إرسال scopusQuartile إذا تم اختيار SCOPUS
        if (Array.isArray(formData.categories) && formData.categories.includes("SCOPUS")) {
          payload.scopusQuartile = formData.scopusQuartile || null;
        }
      }
    }

    if (editingResearch) {
      payload.id = editingResearch.id;
    }

    await onSubmit(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingResearch ? "تعديل بحث" : "إضافة بحث"}</DialogTitle>
          <DialogDescription>أدخل معلومات البحث</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ResearchFormFields
            editingResearch={editingResearch}
            formData={formData}
            onFieldChange={handleFieldChange}
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
