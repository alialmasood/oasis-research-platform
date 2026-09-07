import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuperAdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="outline"
          onClick={onAction}
          className="mt-4 h-9 rounded-lg border-slate-200"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
