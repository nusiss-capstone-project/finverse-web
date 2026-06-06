"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserShell,
  useLangFromQuery,
  useDemoUserId,
  withLangParam,
} from "@/components/user/user-shell";
import {
  apiErrorMessage,
  fetchUserCampaignGroups,
  formatDate,
  type UserCampaignCard,
  type UserCampaignGroups,
} from "@/lib/web/user-app-api";

const EMPTY_CAMPAIGN_GROUPS: UserCampaignGroups = {
  ongoing: [],
  upcoming: [],
};

export default function CampaignsPage() {
  const userId = useDemoUserId();
  const lang = useLangFromQuery();
  const [campaigns, setCampaigns] = useState<UserCampaignGroups>(
    EMPTY_CAMPAIGN_GROUPS,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCampaigns(await fetchUserCampaignGroups());
    } catch (e) {
      setCampaigns(EMPTY_CAMPAIGN_GROUPS);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasCampaigns =
    campaigns.ongoing.length > 0 || campaigns.upcoming.length > 0;

  return (
    <UserShell userId={userId} lang={lang}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Campaigns
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Participate in growth campaigns and earn rewards.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
              <Trophy className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Campaigns
              </h2>
              <p className="text-sm text-slate-500">
                Track ongoing campaigns and upcoming launches.
              </p>
            </div>
          </div>

          {error ? (
            <p
              className="rounded-2xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-sm text-slate-500">
              Loading campaigns…
            </p>
          ) : !hasCampaigns ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/40 p-12 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-slate-900 text-slate-500 ring-1 ring-white/10">
                <Trophy className="size-8" aria-hidden />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                No active campaigns yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <CampaignSection
                title="Ongoing"
                description="Campaigns available to join now."
                emptyText="No ongoing campaigns."
                campaigns={campaigns.ongoing}
                lang={lang}
                showJoined
              />
              <CampaignSection
                title="Upcoming"
                description="Campaigns that will open soon."
                emptyText="No upcoming campaigns."
                campaigns={campaigns.upcoming}
                lang={lang}
              />
            </div>
          )}
        </section>

        <div className="flex justify-center">
          <Button asChild className="rounded-full bg-emerald-500 text-slate-950">
            <Link href={withLangParam("/wallet", lang)}>Back to wallet</Link>
          </Button>
        </div>
      </div>
    </UserShell>
  );
}

function CampaignSection({
  title,
  description,
  emptyText,
  campaigns,
  lang,
  showJoined = false,
}: {
  title: string;
  description: string;
  emptyText: string;
  campaigns: UserCampaignCard[];
  lang?: string;
  showJoined?: boolean;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {campaigns.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              lang={lang}
              showJoined={showJoined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CampaignCard({
  campaign,
  lang,
  showJoined,
}: {
  campaign: UserCampaignCard;
  lang?: string;
  showJoined: boolean;
}) {
  return (
    <Link
      href={withLangParam(`/campaigns/${campaign.id}`, lang)}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-950 to-emerald-950/35 p-6 shadow-2xl shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:border-emerald-400/30"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_95%_5%,rgba(34,197,94,0.16),transparent_35%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-2xl font-semibold text-white">{campaign.name}</h3>
          <ArrowRight className="mt-1 size-6 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-400" />
        </div>

        <div className="mt-6 grid gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 text-emerald-400" aria-hidden />
            Starts {formatDate(campaign.startTime)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="size-4 text-emerald-400" aria-hidden />
            Ends {formatDate(campaign.endTime)}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
          {showJoined ? (
            <Badge
              className={
                campaign.joined
                  ? "rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "rounded-full border-slate-500/20 bg-slate-500/10 text-slate-300"
              }
            >
              <CheckCircle2 className="mr-1 size-3" aria-hidden />
              {campaign.joined ? "Joined" : "Not joined"}
            </Badge>
          ) : (
            <Badge className="rounded-full border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
              Upcoming
            </Badge>
          )}
          <span className="text-sm text-slate-500">#{campaign.id}</span>
        </div>
      </div>
    </Link>
  );
}
