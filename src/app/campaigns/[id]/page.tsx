"use client";

import { Suspense } from "react";

import { CampaignLandingExperience } from "@/components/campaign-landing/campaign-landing-experience";

function CampaignLandingFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#030712] text-slate-400">
      <div className="size-10 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
      <p className="text-sm">Loading…</p>
    </div>
  );
}

export default function CampaignLandingPage() {
  return (
    <Suspense fallback={<CampaignLandingFallback />}>
      <CampaignLandingExperience />
    </Suspense>
  );
}
