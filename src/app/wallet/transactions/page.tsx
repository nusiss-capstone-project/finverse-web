"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsTable } from "@/components/user/transactions-table";
import {
  UserShell,
  useLangFromQuery,
  useDemoUserId,
  withLangParam,
} from "@/components/user/user-shell";
import {
  apiErrorMessage,
  fetchWalletTransactions,
  type WalletTransaction,
} from "@/lib/web/user-app-api";

type TxFilter = "all" | "RECHARGE" | "CAMPAIGN_REWARD";

const FILTERS: { value: TxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "RECHARGE", label: "Recharge" },
  { value: "CAMPAIGN_REWARD", label: "Campaign Rewards" },
];

const PAGE_SIZE = 20;

export default function WalletTransactionsPage() {
  const userId = useDemoUserId();
  const lang = useLangFromQuery();
  const [filter, setFilter] = useState<TxFilter>("all");
  const [rows, setRows] = useState<WalletTransaction[]>([]);
  const [cursorStack, setCursorStack] = useState<(number | undefined)[]>([
    undefined,
  ]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentCursor = cursorStack[cursorStack.length - 1];
  const page = cursorStack.length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWalletTransactions({
        userId,
        type: filter === "all" ? undefined : filter,
        cursor: currentCursor,
        limit: PAGE_SIZE,
      });
      setRows(result.rows);
      setNextCursor(result.nextCursor);
    } catch (e) {
      setRows([]);
      setNextCursor(null);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [currentCursor, filter, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleFilterChange(next: string) {
    setFilter(next as TxFilter);
    setCursorStack([undefined]);
    setNextCursor(null);
  }

  return (
    <UserShell userId={userId} lang={lang}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button
              variant="ghost"
              asChild
              className="mb-4 -ml-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <Link href={withLangParam("/wallet", lang)}>← Wallet</Link>
            </Button>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Wallet Transactions
            </h1>
            <p className="mt-2 text-lg text-slate-400">
              Recharge and campaign reward history.
            </p>
          </div>
          <Tabs value={filter} onValueChange={handleFilterChange}>
            <TabsList className="h-auto gap-2 rounded-2xl bg-slate-950/80 p-1 text-slate-500 ring-1 ring-white/10">
              {FILTERS.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 data-active:bg-emerald-500 data-active:text-slate-950"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
            Loading transactions…
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-sm text-slate-500">
            No transactions found.
          </p>
        ) : (
          <TransactionsTable rows={rows} />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">Page {page}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-white/10 bg-slate-950/60"
              disabled={loading || cursorStack.length <= 1}
              onClick={() => setCursorStack((s) => s.slice(0, -1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              className="border-white/10 bg-slate-950/60"
              disabled={loading || nextCursor == null}
              onClick={() =>
                setCursorStack((s) => [...s, nextCursor ?? undefined])
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </UserShell>
  );
}
