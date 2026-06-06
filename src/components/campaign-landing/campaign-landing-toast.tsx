"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type CampaignToastState = {
  open: boolean;
  message: string;
  variant: "success" | "error";
};

type CampaignLandingToastProps = {
  toast: CampaignToastState;
  onDismiss: () => void;
};

export function CampaignLandingToast({ toast, onDismiss }: CampaignLandingToastProps) {
  useEffect(() => {
    if (!toast.open) return;
    const t = window.setTimeout(() => onDismiss(), 4500);
    return () => window.clearTimeout(t);
  }, [toast.open, toast.message, onDismiss]);

  if (!toast.open) return null;

  const success = toast.variant === "success";

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 left-1/2 z-[100] flex max-w-[min(92vw,24rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4",
        success
          ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-50"
          : "border-red-500/30 bg-red-950/90 text-red-50",
      )}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-red-400" />
      )}
      <p className="text-sm leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
      >
        Dismiss
      </button>
    </div>
  );
}
