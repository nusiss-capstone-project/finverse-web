"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CampaignLandingHero } from "@/components/campaign-landing/campaign-landing-hero";
import {
  CampaignLandingToast,
  type CampaignToastState,
} from "@/components/campaign-landing/campaign-landing-toast";
import { CampaignRewardSection } from "@/components/campaign-landing/campaign-reward-section";
import { CampaignTermsSection } from "@/components/campaign-landing/campaign-terms-section";
import { CampaignTimelineSection } from "@/components/campaign-landing/campaign-timeline-section";
import { CampaignUserActionsSection } from "@/components/campaign-landing/campaign-user-actions-section";
import { isNonProductionRuntime } from "@/lib/is-non-production-runtime";
import { buildCampaignLandingViewModel } from "@/lib/web/campaign-landing-view-model";
import {
  buildCampaignLandingPageUrl,
  fetchCampaignLandingPage,
} from "@/lib/web/user-campaign-api";

function parseId(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

export function CampaignLandingExperience() {
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = useMemo(() => parseId(params?.id), [params?.id]);

  const lang =
    searchParams.get("lang")?.trim() ||
    searchParams.get("language")?.trim() ||
    undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ReturnType<
    typeof buildCampaignLandingViewModel
  > | null>(null);

  const [toast, setToast] = useState<CampaignToastState>({
    open: false,
    message: "",
    variant: "success",
  });

  const dismissToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);

  const showToast = useCallback((next: Omit<CampaignToastState, "open">) => {
    setToast({ open: true, ...next });
  }, []);

  useEffect(() => {
    if (!Number.isFinite(campaignId)) {
      setLoading(false);
      setError("Invalid campaign link.");
      setModel(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      if (isNonProductionRuntime()) {
        console.log(
          "[campaigns/landing] GET",
          buildCampaignLandingPageUrl(campaignId, {
            lang,
          }),
        );
      }

      try {
        const envelope = await fetchCampaignLandingPage(campaignId, {
          lang,
        });
        if (cancelled) return;
        if (envelope.code != null && envelope.code !== 0) {
          setError(envelope.message ?? "Could not load this campaign.");
          setModel(null);
          return;
        }
        setModel(buildCampaignLandingViewModel(campaignId, envelope.data));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load campaign.");
        setModel(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [campaignId, lang]);

  if (!Number.isFinite(campaignId)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#030712] px-6 text-center text-slate-300">
        Invalid campaign link.
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[#030712] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(16,185,129,0.14),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
            <div className="size-10 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
            <p className="text-sm">Loading campaign…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-950/40 px-6 py-10 text-center">
            <p className="text-lg font-medium text-red-200">Something went wrong</p>
            <p className="mt-2 text-sm text-red-300/90">{error}</p>
          </div>
        ) : model ? (
          <div className="flex flex-col gap-14 lg:gap-16">
            <CampaignLandingHero
              title={model.title}
              subtitle={model.subtitle}
              bannerUrl={model.bannerUrl}
            />
            <CampaignRewardSection
              minTopUpLabel={model.minTopUpLabel}
              rewardAmountLabel={model.rewardAmountLabel}
              eligibilityLabel={model.eligibilityLabel}
            />
            <CampaignTimelineSection
              registrationPeriodLabel={model.registrationPeriodLabel}
              campaignPeriodLabel={model.campaignPeriodLabel}
              rewardDistributionLabel={model.rewardDistributionLabel}
            />
            <CampaignUserActionsSection
              campaignId={campaignId}
              onToast={showToast}
            />
            <CampaignTermsSection terms={model.terms} />
            <p className="text-center text-xs text-slate-600">
              Campaign experience · Educational simulation · Not financial advice
            </p>
          </div>
        ) : null}
      </div>

      <CampaignLandingToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
