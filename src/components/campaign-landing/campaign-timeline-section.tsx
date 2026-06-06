"use client";

import { CalendarRange, PartyPopper, UserPlus } from "lucide-react";

type CampaignTimelineSectionProps = {
  registrationPeriodLabel: string;
  campaignPeriodLabel: string;
  rewardDistributionLabel: string;
};

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof CalendarRange;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5 transition-colors hover:border-emerald-500/25 hover:bg-white/[0.05]">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h3 className="font-medium text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
      </div>
    </div>
  );
}

export function CampaignTimelineSection({
  registrationPeriodLabel,
  campaignPeriodLabel,
  rewardDistributionLabel,
}: CampaignTimelineSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Campaign timeline
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Important dates for registration, activity, and rewards.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Step
          icon={UserPlus}
          title="Registration period"
          body={registrationPeriodLabel}
        />
        <Step
          icon={CalendarRange}
          title="Campaign period"
          body={campaignPeriodLabel}
        />
        <Step
          icon={PartyPopper}
          title="Reward distribution"
          body={rewardDistributionLabel}
        />
      </div>
    </section>
  );
}
