"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TransactionStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toUpperCase();
  const success =
    normalized.includes("COMPLETE") ||
    normalized.includes("SUCCESS") ||
    normalized.includes("GRANTED");
  const pending = normalized.includes("PENDING") || normalized.includes("REVIEW");
  const failed = normalized.includes("FAIL") || normalized.includes("REJECT");

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        success && "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        pending && "border-amber-500/20 bg-amber-500/10 text-amber-300",
        failed && "border-red-500/20 bg-red-500/10 text-red-300",
        !success &&
          !pending &&
          !failed &&
          "border-slate-600/50 bg-slate-800/80 text-slate-300",
      )}
    >
      {status || "—"}
    </Badge>
  );
}
