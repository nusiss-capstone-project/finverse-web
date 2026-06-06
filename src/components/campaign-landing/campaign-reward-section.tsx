"use client";

import { BadgeCheck, Gift, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";

type CampaignRewardSectionProps = {
  minTopUpLabel: string;
  rewardAmountLabel: string;
  eligibilityLabel: string;
};

function RewardCard({
  icon: Icon,
  label,
  value,
  accent,
  valueClassName = "text-2xl sm:text-3xl",
}: {
  icon: typeof Gift;
  label: string;
  value: string;
  accent: string;
  valueClassName?: string;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.04] p-6 shadow-lg ring-1 ring-white/5 backdrop-blur-sm transition-colors hover:border-emerald-500/20 hover:bg-white/[0.06]">
      <div
        className={`mb-4 inline-flex size-11 items-center justify-center rounded-2xl ${accent}`}
      >
        <Icon className="size-5 text-white" strokeWidth={1.75} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 font-semibold tracking-tight text-white ${valueClassName}`}
      >
        {value}
      </p>
    </Card>
  );
}

export function CampaignRewardSection({
  minTopUpLabel,
  rewardAmountLabel,
  eligibilityLabel,
}: CampaignRewardSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Reward overview
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Clear numbers. Know exactly what you can earn.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <RewardCard
          icon={Wallet}
          label="Minimum top-up"
          value={minTopUpLabel}
          accent="bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20"
        />
        <RewardCard
          icon={Gift}
          label="Reward amount"
          value={rewardAmountLabel}
          accent="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25"
        />
        <RewardCard
          icon={BadgeCheck}
          label="Eligibility"
          value={eligibilityLabel}
          accent="bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20"
          valueClassName="text-base leading-snug sm:text-lg"
        />
      </div>
    </section>
  );
}
