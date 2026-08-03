"use client";

import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type CampaignLandingHeroProps = {
  title: string;
  bannerUrl: string | null;
  joined: boolean;
  joining?: boolean;
  joinError?: string | null;
  onJoin?: () => void;
};

export function CampaignLandingHero({
  title,
  bannerUrl,
  joined,
  joining = false,
  joinError = null,
  onJoin,
}: Readonly<CampaignLandingHeroProps>) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-emerald-950/40 shadow-2xl shadow-emerald-900/20 ring-1 ring-white/5">
      {bannerUrl ? (
        <div className="relative aspect-[2.4/1] max-h-[min(52vh,420px)] w-full sm:aspect-[2.8/1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt=""
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/70 to-transparent" />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-r from-emerald-600/30 via-slate-800 to-slate-900 sm:h-40" />
      )}

      <div className="relative px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
          Limited campaign
        </p>
        <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {joined ? (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400">
              <CheckCircle2 className="size-5" aria-hidden />
              You have joined this campaign
            </p>
          ) : (
            <Button
              type="button"
              disabled={joining || !onJoin}
              onClick={onJoin}
              className="h-11 w-fit rounded-full bg-white px-6 text-base font-semibold text-slate-950 hover:bg-emerald-50"
            >
              {joining ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Joining…
                </>
              ) : (
                "Join campaign"
              )}
            </Button>
          )}
        </div>
        {joinError ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {joinError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
