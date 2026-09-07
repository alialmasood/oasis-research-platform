"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SuperAdminLogoutButton({
  variant = "header",
}: {
  variant?: "header" | "sidebar";
}) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/super-admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.href = "/super-admin/login";
    }
  };

  return (
    <Button
      type="button"
      variant={variant === "sidebar" ? "ghost" : "outline"}
      onClick={() => void handleLogout()}
      disabled={loading}
      aria-label="تسجيل الخروج من الإدارة العليا"
      className={cn(
        "rounded-lg text-sm",
        variant === "sidebar"
          ? "h-10 w-full justify-start gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          : "h-9 border-slate-200"
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      تسجيل الخروج
    </Button>
  );
}
