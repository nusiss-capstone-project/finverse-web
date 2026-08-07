"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift } from "lucide-react";

import {
  WalletEmptyState,
  WalletFilterChips,
  WalletListError,
  WalletListSkeleton,
  WalletLoadMoreButton,
} from "@/components/wallet/wallet-list-ui";
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
      <WalletFilterChips
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
      />

      {error && !loading ? (
        <WalletListError
          message={error}
          onRetry={() => void loadFirstPage(filter)}
        />
      ) : null}

      <TransactionsListBody
        loading={loading}
        items={items}
        nextCursor={nextCursor}
        loadingMore={loadingMore}
        onLoadMore={() => void loadMore()}
      />
    </div>
  );
}

function TransactionsListBody({
  loading,
  items,
  nextCursor,
  loadingMore,
  onLoadMore,
}: Readonly<{
  loading: boolean;
  items: LedgerEntry[];
  nextCursor: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
}>) {
  if (loading) {
    return <WalletListSkeleton />;
  }

  if (items.length === 0) {
    return <WalletEmptyState message="No transactions found." />;
  }

  return (
    <>
      <ul className="grid gap-3">
        {items.map((entry) => (
          <LedgerListItem key={entry.ledgerId} entry={entry} />
        ))}
      </ul>
      {nextCursor ? (
        <WalletLoadMoreButton loading={loadingMore} onClick={onLoadMore} />
      ) : null}
    </>
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
