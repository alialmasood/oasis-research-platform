"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteFacultyMemberAction } from "../actions";

interface FacultyDeleteButtonProps {
  memberId: string;
  displayName: string;
}

export function FacultyDeleteButton({ memberId, displayName }: FacultyDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteFacultyMemberAction(memberId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        title="حذف الحساب"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">حذف</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حذف حساب التدريسي</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  سيتم حذف حساب <span className="font-semibold text-slate-900">{displayName}</span>{" "}
                  نهائياً من قاعدة البيانات، بما في ذلك بحوثه ونشاطاته وملفه الشخصي.
                </p>
                <p className="text-red-600 font-medium">لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                  جاري الحذف...
                </>
              ) : (
                "حذف نهائي"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
