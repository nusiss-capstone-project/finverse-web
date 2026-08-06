"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BuyAssetFlow } from "@/components/wallet/buy-asset-flow";
import { DepositDialog } from "@/components/wallet/deposit-dialog";
import {
  ASSET_CURRENCY,
  assetApiErrorMessage,
  fetchAssets,
  fetchFiatAccounts,
  fetchHoldings,
  formatAssetMoney,
  formatAssetQuantity,
  mergeAssetsWithHoldings,
  type Asset,
  type AssetRow,
  type FiatAccount,
} from "@/lib/web/asset-api";
import { sumAmountsByCurrency } from "@/lib/web/money";

const REVEAL_AMOUNTS_KEY = "finverse.my-assets.reveal-amounts";
const MASKED_AMOUNT = "••••••";

type MyAssetsPanelProps = {
  lang?: string;
  onSwitchToOrders: (orderId?: string) => void;
};

export function MyAssetsPanel({
  lang,
  onSwitchToOrders,
}: Readonly<MyAssetsPanelProps>) {
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [totalsByCurrency, setTotalsByCurrency] = useState<
    Array<{ currency: string; amount: string }>
  >([]);
  const [fiatAccounts, setFiatAccounts] = useState<FiatAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyAsset, setBuyAsset] = useState<Asset | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [depositAccount, setDepositAccount] = useState<FiatAccount | null>(
    null,
  );
  const [depositOpen, setDepositOpen] = useState(false);
  const [revealAmounts, setRevealAmounts] = useState(false);

  useEffect(() => {
    try {
      setRevealAmounts(window.localStorage.getItem(REVEAL_AMOUNTS_KEY) === "1");
    } catch {
      setRevealAmounts(false);
    }
  }, []);

  const toggleRevealAmounts = useCallback(() => {
    setRevealAmounts((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(REVEAL_AMOUNTS_KEY, next ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assets, holdings, fiat] = await Promise.all([
        fetchAssets(),
        fetchHoldings(),
        fetchFiatAccounts(),
      ]);
      const merged = mergeAssetsWithHoldings(assets, holdings);
      setRows(merged);
      setFiatAccounts(fiat);

      const entries = [
        ...holdings.map((h) => ({
          amount: h.valuation.amount,
          currency: h.valuation.currency || ASSET_CURRENCY,
        })),
        ...fiat.map((a) => ({
          amount: a.balance,
          currency: a.currency || ASSET_CURRENCY,
        })),
      ];
      setTotalsByCurrency(sumAmountsByCurrency(entries));
    } catch (e) {
      setRows([]);
      setFiatAccounts([]);
      setTotalsByCurrency([]);
      setError(assetApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshFiatAccounts = useCallback(async () => {
    try {
      const [holdings, fiat] = await Promise.all([
        fetchHoldings(),
        fetchFiatAccounts(),
      ]);
      setFiatAccounts(fiat);
      const entries = [
        ...holdings.map((h) => ({
          amount: h.valuation.amount,
          currency: h.valuation.currency || ASSET_CURRENCY,
        })),
        ...fiat.map((a) => ({
          amount: a.balance,
          currency: a.currency || ASSET_CURRENCY,
        })),
      ];
      setTotalsByCurrency(sumAmountsByCurrency(entries));
    } catch {
      // keep current UI on soft refresh failure
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openBuy = useCallback((asset: Asset) => {
    setBuyAsset(asset);
    setBuyOpen(true);
  }, []);

  const openDeposit = useCallback((account: FiatAccount) => {
    setDepositAccount(account);
    setDepositOpen(true);
  }, []);

  if (loading) {
    return <MyAssetsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-950/40 p-6">
        <p className="text-sm text-red-200" role="alert">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void load()}
          className="mt-4 rounded-2xl border-white/10 text-white hover:bg-white/5"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <TotalValuationCard
          totals={totalsByCurrency}
          reveal={revealAmounts}
          onToggleReveal={toggleRevealAmounts}
        />

        <FiatAccountsSection
          accounts={fiatAccounts}
          revealAmounts={revealAmounts}
          onDeposit={openDeposit}
        />

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">Crypto Assets</h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse and purchase available assets
            </p>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
              No assets available.
            </p>
          ) : (
            <ul className="grid gap-3">
              {rows.map((row) => (
                <AssetListItem
                  key={row.id}
                  row={row}
                  revealAmounts={revealAmounts}
                  onBuy={() => openBuy(row)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <BuyAssetFlow
        asset={buyAsset}
        open={buyOpen}
        onOpenChange={setBuyOpen}
        lang={lang}
        onViewHolding={() => {
          void load();
        }}
        onViewOrder={(orderId) => onSwitchToOrders(orderId)}
        onPurchaseComplete={() => void load()}
      />

      <DepositDialog
        open={depositOpen}
        account={depositAccount}
        lang={lang}
        onOpenChange={setDepositOpen}
        onCompleted={() => void refreshFiatAccounts()}
      />
    </>
  );
}

function TotalValuationCard({
  totals,
  reveal,
  onToggleReveal,
}: Readonly<{
  totals: Array<{ currency: string; amount: string }>;
  reveal: boolean;
  onToggleReveal: () => void;
}>) {
  const displayTotals =
    totals.length > 0 ? totals : [{ currency: ASSET_CURRENCY, amount: "0.00" }];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/45 p-6 shadow-2xl shadow-emerald-950/20 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(34,197,94,0.18),transparent_35%)]"
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
          <TrendingUp className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-medium text-slate-300">Total Valuation</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleReveal}
              aria-pressed={reveal}
              aria-label={reveal ? "Hide asset amounts" : "Show asset amounts"}
              className="h-9 shrink-0 gap-2 rounded-xl px-2.5 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              {reveal ? (
                <Eye className="size-4" aria-hidden />
              ) : (
                <EyeOff className="size-4" aria-hidden />
              )}
              <span className="text-xs font-medium">
                {reveal ? "Hide" : "Show"}
              </span>
            </Button>
          </div>
          <ul className="mt-3 grid gap-2">
            {displayTotals.map((row) => (
              <li
                key={row.currency}
                className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              >
                {reveal
                  ? formatAssetMoney(row.amount, row.currency)
                  : `${MASKED_AMOUNT} ${row.currency}`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FiatAccountsSection({
  accounts,
  revealAmounts,
  onDeposit,
}: Readonly<{
  accounts: FiatAccount[];
  revealAmounts: boolean;
  onDeposit: (account: FiatAccount) => void;
}>) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Fiat Account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cash balances available for your market
        </p>
      </div>

      {accounts.length === 0 ? (
        <p className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
          No fiat accounts available.
        </p>
      ) : (
        <ul className="grid gap-3">
          {accounts.map((account) => (
            <li
              key={account.currency}
              className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                <Wallet className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-white">
                  {account.currency}
                </p>
                <p className="mt-1 text-sm text-emerald-400/90">
                  {revealAmounts
                    ? formatAssetMoney(account.balance, account.currency)
                    : MASKED_AMOUNT}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => onDeposit(account)}
                className="h-10 shrink-0 rounded-2xl bg-emerald-500 px-5 text-slate-950 hover:bg-emerald-400"
              >
                Deposit
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AssetListItem({
  row,
  revealAmounts,
  onBuy,
}: Readonly<{ row: AssetRow; revealAmounts: boolean; onBuy: () => void }>) {
  const inactive = row.status === "inactive";
  const holdingText = revealAmounts
    ? `Holding: ${formatAssetQuantity(row.holdingQuantity)} · ${formatAssetMoney(row.holdingValue, row.holdingCurrency)}`
    : `Holding: ${MASKED_AMOUNT}`;

  return (
    <li className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
      {row.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.iconUrl}
          alt=""
          className="size-12 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-sm font-bold text-emerald-400">
          {row.symbol.slice(0, 2) || "?"}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-semibold text-white">
            {row.name}
          </p>
          <span className="text-sm text-slate-500">{row.symbol}</span>
          {inactive ? (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-400">
              Inactive
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {formatAssetMoney(row.currentPrice, row.currency)}
        </p>
        <p className="mt-1 text-sm text-emerald-400/90">{holdingText}</p>
      </div>

      <Button
        type="button"
        disabled={inactive}
        onClick={onBuy}
        className="h-10 shrink-0 rounded-2xl bg-emerald-500 px-5 text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
      >
        Buy
      </Button>
    </li>
  );
}

function MyAssetsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-40 animate-pulse rounded-[2rem] border border-white/10 bg-slate-950/60" />
      <div className="h-28 animate-pulse rounded-[2rem] border border-white/10 bg-slate-950/60" />
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-[2rem] border border-white/10 bg-slate-950/60"
          />
        ))}
      </div>
    </div>
  );
}
