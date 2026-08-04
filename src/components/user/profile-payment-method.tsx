"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPaymentMethodSetup,
  fetchPrimaryPaymentMethod,
  formatCardBrand,
  paymentApiErrorMessage,
  type PaymentMethod,
} from "@/lib/web/payment-api";

export function ProfilePaymentMethodSection() {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setMethod(await fetchPrimaryPaymentMethod());
    } catch (e) {
      setMethod(null);
      setLoadError(paymentApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startSetup = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    setDialogError(null);
    try {
      const { redirectUrl } = await createPaymentMethodSetup();
      window.location.assign(redirectUrl);
    } catch (e) {
      setDialogError(paymentApiErrorMessage(e));
      setAdding(false);
    }
  }, [adding]);

  return (
    <>
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-emerald-950/10 sm:p-8">
        <div className="mb-5 flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
            <CreditCard className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Payment Method
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              One card per account. Card details are collected securely by
              Stripe.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading payment method…</p>
        ) : loadError ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-300" role="alert">
              {loadError}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void load()}
              className="h-10 w-fit rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
            >
              Retry
            </Button>
          </div>
        ) : method ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4">
            <p className="text-lg font-semibold text-white">
              {formatCardBrand(method.brand)}
              {method.last4 ? (
                <span className="ml-2 font-mono text-slate-300">
                  •••• {method.last4}
                </span>
              ) : null}
            </p>
            {method.type || method.status ? (
              <p className="mt-2 text-sm text-slate-500">
                {[method.type, method.status].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
        ) : (
          <Button
            type="button"
            disabled={adding}
            onClick={() => void startSetup()}
            className="h-11 rounded-full bg-emerald-500 px-5 text-slate-950 hover:bg-emerald-400"
          >
            {adding ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Redirecting…
              </>
            ) : (
              "Add payment method"
            )}
          </Button>
        )}
      </section>

      <Dialog
        open={dialogError != null}
        onOpenChange={(open) => {
          if (!open) setDialogError(null);
        }}
      >
        <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Could not start setup</DialogTitle>
            <DialogDescription className="text-slate-400">
              {dialogError}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              type="button"
              onClick={() => setDialogError(null)}
              className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
