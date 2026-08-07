"use client";

import { Check, Circle, Loader2 } from "lucide-react";

import type { CampaignTask } from "@/lib/web/user-campaign-api";

function normalizeStatusKey(status: string): string {
  return status.trim().toLowerCase().replaceAll("_", "-");
}

function isCompletedStatus(status: string): boolean {
  const key = normalizeStatusKey(status);
  return key === "complete" || key === "completed";
}

function statusLabel(status: string): string {
  if (isCompletedStatus(status)) return "Complete";
  const key = normalizeStatusKey(status);
  if (key === "in-progress" || key === "inprogress") return "InProgress";
  return status.trim() || "Unknown";
}

export function CampaignTaskProgressSection({
  tasks,
  loading,
  error,
}: Readonly<{
  tasks: CampaignTask[];
  loading: boolean;
  error: string | null;
}>) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Task Progress
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Track your progress for this campaign.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-400">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading tasks…
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-950/40 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && tasks.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-slate-500">
          No tasks available yet.
        </div>
      ) : null}

      {!loading && !error && tasks.length > 0 ? (
        <ul className="grid gap-3">
          {tasks.map((task) => {
            const done = isCompletedStatus(task.status);

            return (
              <li
                key={task.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 ring-1 sm:p-5 ${
                  done
                    ? "border-emerald-500/25 bg-emerald-500/5 ring-emerald-500/10"
                    : "border-white/10 bg-white/[0.03] ring-white/5"
                }`}
              >
                {done ? (
                  <span
                    className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.45)]"
                    aria-label="Complete"
                  >
                    <Check className="size-5 stroke-[3]" aria-hidden />
                  </span>
                ) : (
                  <span
                    className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-500/15 text-slate-500"
                    aria-label="InProgress"
                  >
                    <Circle className="size-5" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">
                      {task.name || `Task ${task.id}`}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        done
                          ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                          : "border-slate-600/50 bg-slate-800/80 text-slate-400"
                      }`}
                    >
                      {statusLabel(task.status)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
