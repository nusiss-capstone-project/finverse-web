"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  assetApiErrorMessage,
  fetchLedgers,
  formatChangeAmount,
  formatUnixTime,
  ledgerBusinessTypeLabel,
  type LedgerBusinessType,
  type LedgerEntry,
} from "@/lib/web/asset-api";

type TxFilter = "all" | "deposit" | "purchase" | "reward";

const FILTER_OPTIONS: { value: TxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposit" },
  { value: "purchase", label: "Purchase" },
  { value: "reward", label: "Reward" },
];

function filterToBusinessType(
  filter: TxFilter,
): LedgerBusinessType | undefined {
  switch (filter) {
    case "deposit":
      return "DEPOSIT";
    case "purchase":
      return "PURCHASE";
    case "reward":
      return "REWARD";
    default:
      return undefined;
  }
}

export function TransactionsPanel() {
  const [filter, setFilter] = useState<TxFilter>("all");
  const [items, setItems] = useState<LedgerEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async (nextFilter: TxFilter) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLedgers({
        businessType: filterToBusinessType(nextFilter),
        limit: 20,
      });
      setItems(result.items);
      setNextCursor(result.nextCursor);
    } catch (e) {
      setItems([]);
      setNextCursor(null);
      setError(assetApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage(filter);
  }, [filter, loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchLedgers({
        businessType: filterToBusinessType(filter),
        cursor: nextCursor,
        limit: 20,
      });
      setItems((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (e) {
      setError(assetApiErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, filter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
            className={
              filter === value
                ? "rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                : "rounded-full border-white/10 bg-slate-950/60 text-slate-300 hover:bg-white/5"
            }
          >
            {label}
          </Button>
        ))}
      </div>

      {error && !loading ? (
        <div className="rounded-[2rem] border border-red-500/20 bg-red-950/40 p-6">
          <p className="text-sm text-red-200" role="alert">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadFirstPage(filter)}
            className="mt-4 rounded-2xl border-white/10 text-white hover:bg-white/5"
          >
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <TransactionsSkeleton />
      ) : items.length === 0 ? (
        <p className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
          No transactions found.
        </p>
      ) : (
        <>
          <ul className="grid gap-3">
            {items.map((entry) => (
              <LedgerListItem key={entry.ledgerId} entry={entry} />
            ))}
          </ul>
          {nextCursor ? (
            <Button
              type="button"
              variant="outline"
              disabled={loadingMore}
              onClick={() => void loadMore()}
              className="mx-auto w-full max-w-xs rounded-2xl border-white/10 text-white hover:bg-white/5 sm:w-auto"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Loading…
                </>
              ) : (
                "Load More"
              )}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

function LedgerListItem({ entry }: Readonly<{ entry: LedgerEntry }>) {
  const isReward = entry.businessType.trim().toUpperCase() === "REWARD";
  const isOutflow = entry.changeAmount.trim().startsWith("-");
  const label = ledgerBusinessTypeLabel(entry.businessType);
  let amountClass = "text-emerald-400";
  if (isReward) {
    amountClass = "text-emerald-300";
  } else if (isOutflow) {
    amountClass = "text-slate-200";
  }

  return (
    <li
      className={`rounded-[2rem] border p-4 sm:p-5 ${
        isReward
          ? "border-emerald-500/35 bg-emerald-500/10"
          : "border-white/10 bg-slate-950/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {isReward ? (
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
              <Gift className="size-5" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-white">{label}</p>
              {isReward ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  Reward
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {entry.assetCode || "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatUnixTime(entry.createdAt)}
            </p>
          </div>
        </div>
        <p
          className={`shrink-0 text-right text-base font-semibold ${amountClass}`}
        >
          {formatChangeAmount(entry.changeAmount, entry.assetCode)}
        </p>
      </div>
    </li>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-[2rem] border border-white/10 bg-slate-950/60"
        />
      ))}
    </div>
  );
}
