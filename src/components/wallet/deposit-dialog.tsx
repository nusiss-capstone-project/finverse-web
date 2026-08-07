"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

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
  createDeposit,
  formatAssetMoney,
  type FiatAccount,
  type FiatTransaction,
} from "@/lib/web/asset-api";
import {
  isPositiveDecimal,
  isValidDecimalInput,
} from "@/lib/web/money";
import {
  fetchPaymentMethods,
  type PaymentMethod,
} from "@/lib/web/payment-api";

type DepositDialogProps = {
  open: boolean;
  account: FiatAccount | null;
  lang?: string;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

type Phase = "form" | "submitting" | "result";

export function DepositDialog({
  open,
  account,
  lang,
  onOpenChange,
  onCompleted,
}: Readonly<DepositDialogProps>) {
  const [phase, setPhase] = useState<Phase>("form");
  const [amount, setAmount] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pmLoading, setPmLoading] = useState(false);
  const [selectedPmId, setSelectedPmId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FiatTransaction | null>(null);
  const idempotentKeyRef = useRef("");

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

  const reset = useCallback(() => {
    idempotentKeyRef.current = crypto.randomUUID();
    setPhase("form");
    setAmount("");
    setSelectedPmId(null);
    setError(null);
    setResult(null);
  }, []);

  useEffect(() => {
    if (!open || !account) return;
    reset();
    void loadPaymentMethods();
  }, [open, account, reset, loadPaymentMethods]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const submit = useCallback(async () => {
    if (!account || selectedPmId == null || !isPositiveDecimal(amount)) return;
    if (!idempotentKeyRef.current) {
      idempotentKeyRef.current = crypto.randomUUID();
    }

    setPhase("submitting");
    setError(null);
    try {
      const txn = await createDeposit({
        amount: amount.trim(),
        currency: account.currency,
        paymentMethodId: selectedPmId,
        idempotentKey: idempotentKeyRef.current,
      });
      setResult(txn);
      setPhase("result");
      onCompleted();
    } catch (e) {
      setError(assetApiErrorMessage(e));
      setResult(null);
      setPhase("result");
    }
  }, [account, selectedPmId, amount, onCompleted]);

  if (!account) return null;

  const canSubmit =
    selectedPmId != null &&
    isPositiveDecimal(amount) &&
    phase === "form" &&
    !pmLoading;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add funds to your {account.currency} account.
          </DialogDescription>
        </DialogHeader>

        {phase === "result" ? (
          <DepositResult
            result={result}
            error={error}
            currency={account.currency}
            onClose={close}
            onTryAgain={() => {
              reset();
              void loadPaymentMethods();
            }}
          />
        ) : (
          <>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
                <p className="text-xs text-slate-500">Currency</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {account.currency}
                </p>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-400">
                  Amount
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  disabled={phase === "submitting"}
                  placeholder="0.00"
                  onChange={(e) => {
                    const next = e.target.value;
                    if (isValidDecimalInput(next) || next === "") {
                      setAmount(next);
                    }
                  }}
                  className="h-12 rounded-2xl border-white/10 bg-slate-900/80 text-lg text-white"
                />
              </label>

              <div>
                <p className="mb-3 text-sm font-medium text-slate-300">
                  Payment method
                </p>
                <PaymentMethodPicker
                  pmLoading={pmLoading}
                  paymentMethods={paymentMethods}
                  selectedPmId={selectedPmId}
                  lang={lang}
                  disabled={phase === "submitting"}
                  onSelectPm={setSelectedPmId}
                />
              </div>
            </div>

            <DialogFooter className="border-white/10 bg-transparent sm:justify-stretch">
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => void submit()}
                className="w-full rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                {phase === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Depositing…
                  </>
                ) : (
                  "Confirm Deposit"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DepositResultActions({
  primaryLabel,
  onPrimary,
  onClose,
}: Readonly<{
  primaryLabel: string;
  onPrimary: () => void;
  onClose?: () => void;
}>) {
  if (!onClose) {
    return (
      <DialogFooter className="border-white/10 bg-transparent sm:justify-stretch">
        <Button
          type="button"
          onClick={onPrimary}
          className="w-full rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
        >
          {primaryLabel}
        </Button>
      </DialogFooter>
    );
  }

  return (
    <DialogFooter className="flex-col gap-2 border-white/10 bg-transparent sm:flex-col">
      <Button
        type="button"
        onClick={onPrimary}
        className="w-full rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
      >
        {primaryLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="w-full rounded-2xl border-white/10 text-white hover:bg-white/5"
      >
        Close
      </Button>
    </DialogFooter>
  );
}

function DepositResult({
  result,
  error,
  currency,
  onClose,
  onTryAgain,
}: Readonly<{
  result: FiatTransaction | null;
  error: string | null;
  currency: string;
  onClose: () => void;
  onTryAgain: () => void;
}>) {
  if (error || !result) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-red-300" role="alert">
          {error || "Deposit failed."}
        </p>
        <DepositResultActions
          primaryLabel="Try Again"
          onPrimary={onTryAgain}
          onClose={onClose}
        />
      </div>
    );
  }

  if (result.status === "SUCCEEDED") {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-emerald-300">
          Deposit successful.{" "}
          {formatAssetMoney(result.amount, result.currency || currency)} added.
        </p>
        <DepositResultActions primaryLabel="Done" onPrimary={onClose} />
      </div>
    );
  }

  if (result.status === "FAILED") {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-red-300" role="alert">
          {result.failureReason || "Deposit failed."}
        </p>
        <DepositResultActions
          primaryLabel="Try Again"
          onPrimary={onTryAgain}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-amber-300">
        Deposit is pending. Your balance will update when payment completes.
      </p>
      <DepositResultActions primaryLabel="Done" onPrimary={onClose} />
    </div>
  );
}
