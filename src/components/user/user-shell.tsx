"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { Trophy, User, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/campaigns", label: "Campaigns", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function useDemoUserId(defaultUserId = 10001): number {
  const raw = process.env.NEXT_PUBLIC_DEMO_USER_ID;
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : defaultUserId;
}

export function useLangFromQuery(): string | undefined {
  const searchParams = useSearchParams();
  return searchParams.get("lang")?.trim() || undefined;
}

export function withLangParam(href: string, lang?: string): string {
  const [path, qs = ""] = href.split("?");
  const params = new URLSearchParams(qs);
  if (lang?.trim()) {
    params.set("lang", lang.trim());
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function UserShell({
  children,
  userId,
  lang,
}: {
  children: ReactNode;
  userId: number;
  lang?: string;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const displayName =
    user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="relative min-h-dvh bg-[#030712] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(34,197,94,0.14),transparent_55%),radial-gradient(ellipse_50%_35%_at_100%_15%,rgba(16,185,129,0.1),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
        <header className="mb-8 flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-2xl shadow-emerald-950/10 backdrop-blur md:px-6">
          <Link
            href={withLangParam("/wallet", lang)}
            className="flex items-center gap-3"
          >
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25">
              <Wallet className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Growth Rewards
              </p>
              <p className="text-xs text-slate-500">
                {displayName ?? `Demo user #${userId}`}
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={withLangParam(href, lang)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="min-h-0 flex-1">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#030712]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={withLangParam(href, lang)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-slate-500 hover:text-slate-200",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
