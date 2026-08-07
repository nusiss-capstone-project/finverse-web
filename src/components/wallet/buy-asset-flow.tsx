"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaymentMethodPicker } from "@/components/wallet/payment-method-picker";
import {
  assetApiErrorMessage,
  createOrder,
  createQuote,
  fetchOrderDetail,
  formatAssetMoney,
  formatAssetQuantity,
  isOrderTerminal,
  type Asset,
  type Order,
  type Quote,
} from "@/lib/web/asset-api";
import {
  isPositiveDecimal,
  isValidDecimalInput,
  multiplyAmount,
} from "@/lib/web/money";
import {
  fetchPaymentMethods,
  type PaymentMethod,
} from "@/lib/web/payment-api";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

type BuyPhase =
  | "form"
  | "review"
  | "submitting"
  | "pending"
  | "pending_timeout"
  | "success"
  | "failed";

type BuyAssetFlowProps = {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang?: string;
  onViewHolding: () => void;
  onViewOrder: (orderId: string) => void;
  onPurchaseComplete: () => void;
};

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function useQuoteCountdown(expiresAt: number | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }

    const tick = () => {
      const secs = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
      setRemaining(secs);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

function formatCountdown(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isQuoteValid(quote: Quote | null, remaining: number | null): boolean {
  if (!quote) return false;
  if (remaining == null) return true;
  return remaining > 0;
}

export function BuyAssetFlow({
  asset,
  open,
  onOpenChange,
  lang,
  onViewHolding,
  onViewOrder,
  onPurchaseComplete,
}: Readonly<BuyAssetFlowProps>) {
  const isDesktop = useIsDesktop();
  const [phase, setPhase] = useState<BuyPhase>("form");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pmLoading, setPmLoading] = useState(false);
  const [selectedPmId, setSelectedPmId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const idempotencyKeyRef = useRef<string>("");
  const pollAbortRef = useRef(false);

  const remaining = useQuoteCountdown(quote?.expiresAt ?? null);
  const quoteValid = isQuoteValid(quote, remaining);
  const estimatedTotal =
    quote && isPositiveDecimal(quantity)
      ? multiplyAmount(quantity, quote.unitPrice)
      : null;

  const resetSession = useCallback(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
    setPhase("form");
    setQuantity("");
    setQuote(null);
    setQuoteError(null);
    setReviewOpen(false);
    setSelectedPmId(null);
    setSubmitError(null);
    setOrder(null);
    pollAbortRef.current = false;
  }, []);

  const loadQuote = useCallback(async () => {
    if (!asset) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      setQuote(await createQuote(asset.id));
    } catch (e) {
      setQuote(null);
      setQuoteError(assetApiErrorMessage(e));
    } finally {
      setQuoteLoading(false);
    }
  }, [asset]);

  const loadPaymentMethods = useCallback(async () => {
    setPmLoading(true);
    try {
      setPaymentMethods(await fetchPaymentMethods());
    } catch {
      setPaymentMethods([]);
    } finally {
      setPmLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !asset) return;
    resetSession();
    void loadQuote();
  }, [open, asset, resetSession, loadQuote]);

  useEffect(() => {
    pollAbortRef.current = false;
    return () => {
      pollAbortRef.current = true;
    };
  }, []);

  const closeFlow = useCallback(() => {
    pollAbortRef.current = true;
    onOpenChange(false);
  }, [onOpenChange]);

  const openReview = useCallback(() => {
    setReviewOpen(true);
    setSelectedPmId(null);
    void loadPaymentMethods();
  }, [loadPaymentMethods]);

  const pollOrderStatus = useCallback(async (orderId: string) => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (!pollAbortRef.current && Date.now() < deadline) {
      await new Promise((r) => window.setTimeout(r, POLL_INTERVAL_MS));
      if (pollAbortRef.current) return;
      try {
        const detail = await fetchOrderDetail(orderId);
        setOrder(detail);
        if (isOrderTerminal(detail.status)) {
          if (detail.status === "pay_succeed") {
            setPhase("success");
            onPurchaseComplete();
          } else {
            setPhase("failed");
          }
          return;
        }
      } catch {
        // keep polling on transient errors
      }
    }
    if (!pollAbortRef.current) {
      setPhase("pending_timeout");
    }
  }, [onPurchaseComplete]);

  const submitOrder = useCallback(async () => {
    if (!quote || selectedPmId == null || !isPositiveDecimal(quantity)) return;
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    setPhase("submitting");
    setSubmitError(null);
    try {
      const created = await createOrder({
        quoteId: quote.quoteId,
        quantity: quantity.trim(),
        paymentMethodId: selectedPmId,
        idempotencyKey: idempotencyKeyRef.current,
      });
      setOrder(created);
      setReviewOpen(false);

      if (created.status === "pay_succeed") {
        setPhase("success");
        onPurchaseComplete();
        return;
      }
      if (created.status === "pay_fail") {
        setPhase("failed");
        return;
      }

      setPhase("pending");
      void pollOrderStatus(created.orderId);
    } catch (e) {
      setPhase("failed");
      setSubmitError(assetApiErrorMessage(e));
    }
  }, [
    quote,
    selectedPmId,
    quantity,
    pollOrderStatus,
    onPurchaseComplete,
  ]);

  const handleTryAgain = useCallback(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
    setPhase("form");
    setSubmitError(null);
    setOrder(null);
    setReviewOpen(false);
    setSelectedPmId(null);
    void loadQuote();
  }, [loadQuote]);

  const handleChangePaymentMethod = useCallback(() => {
    setPhase("form");
    setSubmitError(null);
    setReviewOpen(true);
    setSelectedPmId(null);
    void loadPaymentMethods();
  }, [loadPaymentMethods]);

  if (!open || !asset) return null;

  const canReview =
    quoteValid &&
    isPositiveDecimal(quantity) &&
    !quoteLoading &&
    quote != null;

  const formContent = (
    <BuyFormContent
      asset={asset}
      quote={quote}
      quoteLoading={quoteLoading}
      quoteError={quoteError}
      quoteValid={quoteValid}
      remaining={remaining}
      quantity={quantity}
      estimatedTotal={estimatedTotal}
      phase={phase}
      submitError={submitError}
      onQuantityChange={setQuantity}
      onRefreshQuote={() => void loadQuote()}
      onReview={openReview}
      onClose={closeFlow}
      canReview={canReview}
    />
  );

  const reviewDialog = (
    <PurchaseReviewDialog
      open={reviewOpen}
      onOpenChange={setReviewOpen}
      asset={asset}
      quantity={quantity}
      quote={quote}
      estimatedTotal={estimatedTotal}
      paymentMethods={paymentMethods}
      pmLoading={pmLoading}
      selectedPmId={selectedPmId}
      onSelectPm={setSelectedPmId}
      quoteValid={quoteValid}
      submitting={phase === "submitting"}
      lang={lang}
      onConfirm={() => void submitOrder()}
    />
  );

  const outcomeDialogs = (
    <>
      <PurchaseSuccessDialog
        open={phase === "success"}
        order={order}
        onViewHolding={() => {
          closeFlow();
          onViewHolding();
        }}
        onViewOrder={() => {
          if (order) {
            closeFlow();
            onViewOrder(order.orderId);
          }
        }}
        onClose={closeFlow}
      />
      <PurchaseFailedDialog
        open={phase === "failed"}
        error={submitError}
        onTryAgain={handleTryAgain}
        onChangePaymentMethod={handleChangePaymentMethod}
        onClose={closeFlow}
      />
      <PurchasePendingTimeoutDialog
        open={phase === "pending_timeout"}
        order={order}
        onViewOrder={() => {
          if (order) {
            closeFlow();
            onViewOrder(order.orderId);
          }
        }}
        onClose={closeFlow}
      />
    </>
  );

  if (isDesktop) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:bg-black/20"
          onClick={closeFlow}
          aria-hidden
        />
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
          {formContent}
        </aside>
        {reviewDialog}
        {outcomeDialogs}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && closeFlow()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
          {formContent}
        </DialogContent>
      </Dialog>
      {reviewDialog}
      {outcomeDialogs}
    </>
  );
}

function BuyFormContent({
  asset,
  quote,
  quoteLoading,
  quoteError,
  quoteValid,
  remaining,
  quantity,
  estimatedTotal,
  phase,
  submitError,
  onQuantityChange,
  onRefreshQuote,
  onReview,
  onClose,
  canReview,
}: Readonly<{
  asset: Asset;
  quote: Quote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  quoteValid: boolean;
  remaining: number | null;
  quantity: string;
  estimatedTotal: string | null;
  phase: BuyPhase;
  submitError: string | null;
  onQuantityChange: (v: string) => void;
  onRefreshQuote: () => void;
  onReview: () => void;
  onClose: () => void;
  canReview: boolean;
}>) {
  const isBusy = phase === "submitting" || phase === "pending";

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {asset.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.iconUrl}
              alt=""
              className="size-12 rounded-2xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-lg font-bold text-emerald-400">
              {asset.symbol.slice(0, 2) || "?"}
            </span>
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">{asset.name}</h2>
            <p className="text-sm text-slate-400">{asset.symbol}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          Close
        </Button>
      </div>

      {quoteLoading ? (
        <p className="mb-4 text-sm text-slate-500">Fetching quote…</p>
      ) : null}

      {quoteError ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-950/40 px-4 py-3">
          <p className="text-sm text-red-200" role="alert">
            {quoteError}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshQuote}
            className="shrink-0 border-white/10 text-white"
          >
            Retry
          </Button>
        </div>
      ) : null}

      {quote ? (
        <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Unit price</span>
            <span className="font-semibold text-white">
              {formatAssetMoney(quote.unitPrice, quote.currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-400">Quote expires</span>
            <div className="flex items-center gap-2">
              <span
                className={
                  quoteValid ? "text-emerald-400" : "text-amber-400"
                }
              >
                {formatCountdown(remaining)}
              </span>
              <button
                type="button"
                onClick={onRefreshQuote}
                className="text-slate-500 hover:text-emerald-400"
                aria-label="Refresh quote"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>
          {!quoteValid ? (
            <p className="mt-2 text-xs text-amber-400">
              Quote expired. Refresh to continue.
            </p>
          ) : null}
        </div>
      ) : null}

      <label className="mb-6 grid gap-2">
        <span className="text-sm font-medium text-slate-400">Quantity</span>
        <Input
          type="text"
          inputMode="decimal"
          value={quantity}
          disabled={isBusy}
          placeholder="0.00"
          onChange={(e) => {
            const next = e.target.value;
            if (isValidDecimalInput(next) || next === "") {
              onQuantityChange(next);
            }
          }}
          className="h-12 rounded-2xl border-white/10 bg-slate-900/80 text-lg text-white"
        />
      </label>

      {estimatedTotal ? (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm text-slate-400">Estimated payment</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">
            {formatAssetMoney(
              estimatedTotal,
              quote?.currency ?? asset.currency,
            )}
          </p>
        </div>
      ) : null}

      {phase === "pending" ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Processing payment…
        </div>
      ) : null}

      {submitError && phase === "failed" ? (
        <p className="mb-4 text-sm text-red-300" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <Button
          type="button"
          disabled={!canReview || isBusy}
          onClick={onReview}
          className="h-12 rounded-2xl bg-emerald-500 text-base font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {isBusy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Processing…
            </>
          ) : (
            "Review Purchase"
          )}
        </Button>
      </div>
    </div>
  );
}

function PurchaseReviewDialog({
  open,
  onOpenChange,
  asset,
  quantity,
  quote,
  estimatedTotal,
  paymentMethods,
  pmLoading,
  selectedPmId,
  onSelectPm,
  quoteValid,
  submitting,
  lang,
  onConfirm,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset;
  quantity: string;
  quote: Quote | null;
  estimatedTotal: string | null;
  paymentMethods: PaymentMethod[];
  pmLoading: boolean;
  selectedPmId: number | null;
  onSelectPm: (id: number) => void;
  quoteValid: boolean;
  submitting: boolean;
  lang?: string;
  onConfirm: () => void;
}>) {
  const canConfirm =
    selectedPmId != null && quoteValid && isPositiveDecimal(quantity) && !submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Purchase</DialogTitle>
          <DialogDescription className="text-slate-400">
            Confirm quantity, price, and payment method.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <ReviewRow label="Asset" value={`${asset.name} (${asset.symbol})`} />
          <ReviewRow
            label="Quantity"
            value={formatAssetQuantity(quantity)}
          />
          {quote ? (
            <ReviewRow
              label="Unit price"
              value={formatAssetMoney(quote.unitPrice, quote.currency)}
            />
          ) : null}
          {estimatedTotal ? (
            <ReviewRow
              label="Total"
              value={formatAssetMoney(
                estimatedTotal,
                quote?.currency ?? asset.currency,
              )}
              highlight
            />
          ) : null}
        </div>

        <div className="mt-2">
          <p className="mb-3 text-sm font-medium text-slate-300">
            Payment method
          </p>
          <PaymentMethodPicker
            pmLoading={pmLoading}
            paymentMethods={paymentMethods}
            selectedPmId={selectedPmId}
            lang={lang}
            onSelectPm={onSelectPm}
          />
        </div>

        <DialogFooter className="border-white/10 bg-transparent sm:justify-stretch">
          <Button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className="w-full rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Confirming…
              </>
            ) : (
              "Confirm & Pay"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({
  label,
  value,
  highlight = false,
}: Readonly<{
  label: string;
  value: string;
  highlight?: boolean;
}>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span
        className={
          highlight
            ? "font-semibold text-emerald-400"
            : "font-medium text-white"
        }
      >
        {value}
      </span>
    </div>
  );
}

function PurchaseSuccessDialog({
  open,
  order,
  onViewHolding,
  onViewOrder,
  onClose,
}: Readonly<{
  open: boolean;
  order: Order | null;
  onViewHolding: () => void;
  onViewOrder: () => void;
  onClose: () => void;
}>) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-400">Purchase successful</DialogTitle>
          <DialogDescription className="text-slate-400">
            Your order has been completed.
          </DialogDescription>
        </DialogHeader>
        {order ? (
          <p className="text-sm text-slate-300">
            {formatAssetQuantity(order.quantity)} purchased
            {order.asset?.symbol ? ` · ${order.asset.symbol}` : ""}
          </p>
        ) : null}
        <DialogFooter className="flex-col gap-2 border-white/10 bg-transparent sm:flex-col">
          <Button
            type="button"
            onClick={onViewHolding}
            className="w-full rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            View Holding
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onViewOrder}
            className="w-full rounded-2xl border-white/10 text-white hover:bg-white/5"
          >
            View Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PurchaseFailedDialog({
  open,
  error,
  onTryAgain,
  onChangePaymentMethod,
  onClose,
}: Readonly<{
  open: boolean;
  error: string | null;
  onTryAgain: () => void;
  onChangePaymentMethod: () => void;
  onClose: () => void;
}>) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-300">Payment failed</DialogTitle>
          <DialogDescription className="text-slate-400">
            {error ?? "We could not complete your purchase."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 border-white/10 bg-transparent sm:flex-col">
          <Button
            type="button"
            onClick={onTryAgain}
            className="w-full rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            Try Again
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onChangePaymentMethod}
            className="w-full rounded-2xl border-white/10 text-white hover:bg-white/5"
          >
            Change Payment Method
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PurchasePendingTimeoutDialog({
  open,
  order,
  onViewOrder,
  onClose,
}: Readonly<{
  open: boolean;
  order: Order | null;
  onViewOrder: () => void;
  onClose: () => void;
}>) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-300">Payment processing</DialogTitle>
          <DialogDescription className="text-slate-400">
            Your payment is still being processed. This is not a failure — check
            your order status for updates.
            {order ? ` (Order ${order.orderNo})` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-white/10 bg-transparent">
          <Button
            type="button"
            onClick={onViewOrder}
            className="w-full rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            View Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
