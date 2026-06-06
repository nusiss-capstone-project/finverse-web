"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownCircle,
  Eye,
  EyeOff,
  Wallet as WalletIcon,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TransactionStatusBadge } from "@/components/user/transaction-status-badge";
import {
  UserShell,
  useLangFromQuery,
  useDemoUserId,
  withLangParam,
} from "@/components/user/user-shell";
import {
  apiErrorMessage,
  DEFAULT_WEB_CURRENCY,
  fetchWalletSummary,
  fetchWalletTransactions,
  formatDateTime,
  formatMoney,
  type WalletSummary,
  type WalletTransaction,
} from "@/lib/web/user-app-api";

export default function WalletPage() {
  const userId = useDemoUserId();
  const lang = useLangFromQuery();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, txData] = await Promise.all([
        fetchWalletSummary(userId),
        fetchWalletTransactions({ userId, limit: 5 }),
      ]);
      setSummary(summaryData);
      setTransactions(txData.rows.slice(0, 5));
    } catch (e) {
      setSummary(null);
      setTransactions([]);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <UserShell userId={userId} lang={lang}>
      <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Wallet
            </h1>
            <p className="mt-2 text-lg text-slate-400">
              Manage your funds and campaign rewards.
            </p>
          </div>

          {error ? (
            <p
              className="rounded-2xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/45 p-6 shadow-2xl shadow-emerald-950/20 sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(34,197,94,0.18),transparent_35%)]"
              aria-hidden
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <div className="flex items-center gap-4">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                    <WalletIcon className="size-7" aria-hidden />
                  </span>
                  <p className="text-lg font-medium">Available Balance</p>
                </div>
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/40 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setBalanceVisible((visible) => !visible)}
                  aria-label={
                    balanceVisible ? "Hide account balance" : "Show account balance"
                  }
                  aria-pressed={balanceVisible}
                >
                  {balanceVisible ? (
                    <EyeOff className="size-5" aria-hidden />
                  ) : (
                    <Eye className="size-5" aria-hidden />
                  )}
                </button>
              </div>

              <div className="mt-8 flex items-end gap-3">
                <p className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                  {loading || !summary
                    ? "—"
                    : balanceVisible
                      ? summary.availableBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "******"}
                </p>
                {balanceVisible ? (
                  <p className="pb-2 text-xl font-semibold text-slate-400">
                    {summary?.currency ?? DEFAULT_WEB_CURRENCY}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <MiniMetric
                  icon={<Zap className="size-5" aria-hidden />}
                  label="Campaign Rewards"
                  value={
                    summary && balanceVisible
                      ? formatMoney(summary.campaignRewards, summary.currency)
                      : balanceVisible
                        ? "—"
                        : "****"
                  }
                />
                <MiniMetric
                  icon={<ArrowDownCircle className="size-5" aria-hidden />}
                  label="Total Recharged"
                  value={
                    summary && balanceVisible
                      ? formatMoney(summary.totalRecharged, summary.currency)
                      : balanceVisible
                        ? "—"
                        : "****"
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="h-13 flex-1 rounded-2xl bg-emerald-500 text-base font-semibold text-slate-950 hover:bg-emerald-400"
              onClick={() => setRechargeOpen(true)}
            >
              Recharge
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-13 flex-1 rounded-2xl border-white/10 bg-slate-950/60 text-base text-white hover:bg-white/5"
            >
              <Link href={withLangParam("/wallet/transactions", lang)}>
                View Transactions
              </Link>
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Recent Transactions
              </h2>
              <p className="mt-1 text-sm text-slate-500">Latest wallet activity</p>
            </div>
            <Button variant="ghost" asChild className="text-emerald-400">
              <Link href={withLangParam("/wallet/transactions", lang)}>
                View All
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-500">
                Loading transactions…
              </p>
            ) : transactions.length === 0 ? (
              <p className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-500">
                No recent transactions.
              </p>
            ) : (
              transactions.map((tx, index) => (
                <div
                  key={`${tx.transactionNo}-${index}`}
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white">
                        {tx.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(tx.createdAt)}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-lg font-semibold text-emerald-400">
                      +{formatMoney(tx.amount, tx.currency)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-600">
                      {tx.transactionNo}
                    </span>
                    <TransactionStatusBadge status={tx.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <Dialog open={rechargeOpen} onOpenChange={setRechargeOpen}>
        <DialogContent className="border border-white/10 bg-slate-950 text-slate-100">
          <DialogHeader>
            <DialogTitle>Recharge</DialogTitle>
            <DialogDescription>
              Recharge API is not available in the generated client yet.
            </DialogDescription>
          </DialogHeader>
          {/* TODO: wire this form once a user account recharge API is generated. */}
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-400">Amount</span>
              <Input
                disabled
                placeholder="100"
                className="border-white/10 bg-slate-900/80"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-400">Currency</span>
              <Input
                disabled
                placeholder={DEFAULT_WEB_CURRENCY}
                className="border-white/10 bg-slate-900/80"
              />
            </label>
            <Button disabled className="bg-emerald-500 text-slate-950">
              Submit recharge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </UserShell>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-slate-950/50 p-5">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="text-emerald-400">{icon}</span>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
