"use client";

import { Gift, Loader2 } from "lucide-react";

import { formatDateTime } from "@/lib/web/user-app-api";
import type { CampaignRewardRecord } from "@/lib/web/user-campaign-api";

export function CampaignRewardHistorySection({
  rewards,
  loading,
  error,
}: Readonly<{
  rewards: CampaignRewardRecord[];
  loading: boolean;
  error: string | null;
}>) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Reward History
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Rewards issued for this campaign.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-400">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading rewards…
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-950/40 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && rewards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-10 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Gift className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-medium text-slate-300">No rewards yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Complete campaign tasks to earn rewards. Issued rewards will show up
            here.
          </p>
        </div>
      ) : null}

      {!loading && !error && rewards.length > 0 ? (
        <ul className="grid gap-3">
          {rewards.map((reward) => (
            <li
              key={reward.voucherId}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 ring-1 ring-emerald-500/10 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {reward.rewardAmount
                      ? `${reward.rewardAmount} ${reward.unit}`.trim()
                      : reward.voucherType || "Reward"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {reward.voucherType || "—"}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-slate-500">
                    {reward.voucherId}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatDateTime(reward.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                  {reward.status || "ISSUED"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
