"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2, ChevronRight, Shield, User, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  UserShell,
  useLangFromQuery,
  useDemoUserId,
} from "@/components/user/user-shell";
import {
  apiErrorMessage,
  fetchUserProfile,
  type UserProfile,
} from "@/lib/web/user-app-api";

export default function ProfilePage() {
  const userId = useDemoUserId();
  const lang = useLangFromQuery();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchUserProfile());
    } catch (e) {
      setProfile(null);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <UserShell userId={userId} lang={lang}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Profile
          </h1>
          <p className="mt-2 text-lg text-slate-400">Manage your account.</p>
        </div>

        {error ? (
          <p
            className="rounded-2xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-emerald-950/10 sm:p-8">
          {loading ? (
            <p className="text-sm text-slate-500">Loading profile…</p>
          ) : profile ? (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex size-28 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                    <User className="size-14" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-white">
                      {profile.username || "—"}
                    </h2>
                    <p className="mt-3 text-xl text-slate-400">
                      {profile.email || "—"}
                    </p>
                    <p
                      className={
                        profile.kycChecked
                          ? "mt-3 inline-flex items-center gap-2 text-base font-medium text-emerald-400"
                          : "mt-3 inline-flex items-center gap-2 text-base font-medium text-amber-300"
                      }
                    >
                      {profile.kycChecked ? (
                        <CheckCircle2 className="size-5" aria-hidden />
                      ) : (
                        <XCircle className="size-5" aria-hidden />
                      )}
                      {profile.kycChecked ? "Verified" : "KYC Pending"}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    profile.kycChecked
                      ? "w-fit rounded-full border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-emerald-300"
                      : "w-fit rounded-full border-amber-500/20 bg-amber-500/10 px-4 py-2 text-amber-300"
                  }
                >
                  {profile.kycChecked ? "KYC Verified" : "KYC Pending"}
                </Badge>
              </div>

            </div>
          ) : (
            <p className="text-sm text-slate-500">No profile data.</p>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ProfileAction
            icon={<Shield className="size-7" aria-hidden />}
            title="Security Settings"
          />
          <ProfileAction
            icon={<Bell className="size-7" aria-hidden />}
            title="Notifications"
            badge="3"
          />
        </section>
      </div>
    </UserShell>
  );
}

function ProfileAction({
  icon,
  title,
  badge,
}: {
  icon: ReactNode;
  title: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-5 rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 text-left transition hover:border-white/15 hover:bg-white/[0.03]"
      onClick={(e) => e.preventDefault()}
    >
      <span className="flex size-16 items-center justify-center rounded-3xl bg-slate-900 text-slate-400 ring-1 ring-white/10 group-hover:text-emerald-400">
        {icon}
      </span>
      <p className="min-w-0 flex-1 text-xl font-semibold text-white">{title}</p>
      {badge ? (
        <span className="flex size-8 items-center justify-center rounded-full bg-red-500 text-sm font-semibold text-white">
          {badge}
        </span>
      ) : null}
      <ChevronRight className="size-6 text-slate-500" aria-hidden />
    </button>
  );
}
