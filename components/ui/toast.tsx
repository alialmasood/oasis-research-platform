"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <>
      <style>{`
        @keyframes toastFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .toast-animate {
          animation: toastFadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 toast-animate">
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm min-w-[280px]",
            type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          {type === "success" && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
          <span className="text-sm font-medium flex-1">{message}</span>
          <button
            onClick={onClose}
            className="mr-2 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
