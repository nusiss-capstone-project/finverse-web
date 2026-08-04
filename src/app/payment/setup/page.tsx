"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

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
  UserShell,
  useDemoUserId,
  useLangFromQuery,
  withLangParam,
} from "@/components/user/user-shell";
import {
  fetchPrimaryPaymentMethod,
  isPaymentTransientError,
  paymentApiErrorMessage,
} from "@/lib/web/payment-api";

type SetupState =
  | "polling"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "timeout";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

function PaymentSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useDemoUserId();
  const lang = useLangFromQuery();
  const cancelled = searchParams.get("setup") === "cancelled";

  const [state, setState] = useState<SetupState>(
    cancelled ? "cancelled" : "polling",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const inFlightRef = useRef(false);
  const stoppedRef = useRef(cancelled);

  const goToProfile = useCallback(() => {
    router.push(withLangParam("/profile", lang));
  }, [lang, router]);

  useEffect(() => {
    if (cancelled) return;

    stoppedRef.current = false;
    const startedAt = Date.now();
    const intervalIdRef = { current: undefined as number | undefined };

    const pollOnce = async () => {
      if (stoppedRef.current || inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const method = await fetchPrimaryPaymentMethod();
        if (stoppedRef.current) return;
        if (method) {
          stoppedRef.current = true;
          if (intervalIdRef.current != null) {
            window.clearInterval(intervalIdRef.current);
          }
          setState("succeeded");
          setDialogOpen(true);
          return;
        }
        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          stoppedRef.current = true;
          if (intervalIdRef.current != null) {
            window.clearInterval(intervalIdRef.current);
          }
          setState("timeout");
          setDialogOpen(true);
        }
      } catch (e) {
        if (stoppedRef.current) return;
        if (isPaymentTransientError(e)) {
          if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
            stoppedRef.current = true;
            if (intervalIdRef.current != null) {
              window.clearInterval(intervalIdRef.current);
            }
            setState("timeout");
            setDialogOpen(true);
          }
          return;
        }
        stoppedRef.current = true;
        if (intervalIdRef.current != null) {
          window.clearInterval(intervalIdRef.current);
        }
        setErrorMessage(paymentApiErrorMessage(e));
        setState("failed");
        setDialogOpen(true);
      } finally {
        inFlightRef.current = false;
      }
    };

    void pollOnce();
    intervalIdRef.current = window.setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);

    return () => {
      stoppedRef.current = true;
      if (intervalIdRef.current != null) {
        window.clearInterval(intervalIdRef.current);
      }
    };
  }, [cancelled]);

  return (
    <UserShell userId={userId} lang={lang}>
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 text-center">
        {state === "cancelled" ? (
          <>
            <span className="flex size-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25">
              <XCircle className="size-8" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Setup cancelled
              </h1>
              <p className="mt-2 text-slate-400">
                You left Stripe before finishing. No payment method was added.
              </p>
            </div>
            <Button
              type="button"
              onClick={goToProfile}
              className="h-11 rounded-full bg-emerald-500 px-6 text-slate-950 hover:bg-emerald-400"
            >
              Back to Profile
            </Button>
          </>
        ) : state === "polling" ? (
          <>
            <Loader2
              className="size-10 animate-spin text-emerald-400"
              aria-hidden
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Confirming your payment method...
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                This usually takes a few seconds.
              </p>
            </div>
          </>
        ) : state === "succeeded" ? (
          <>
            <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
              <CheckCircle2 className="size-8" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Payment method added
              </h1>
              <p className="mt-2 text-slate-400">
                Your card is ready to use.
              </p>
            </div>
          </>
        ) : state === "timeout" ? (
          <>
            <Loader2 className="size-10 text-amber-300" aria-hidden />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Still confirming
              </h1>
              <p className="mt-2 text-slate-400">
                We&apos;re still confirming your payment method. Please check
                again shortly.
              </p>
            </div>
            <Button
              type="button"
              onClick={goToProfile}
              className="h-11 rounded-full bg-emerald-500 px-6 text-slate-950 hover:bg-emerald-400"
            >
              Back to Profile
            </Button>
          </>
        ) : (
          <>
            <span className="flex size-16 items-center justify-center rounded-full bg-red-500/15 text-red-300 ring-1 ring-red-500/25">
              <XCircle className="size-8" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Confirmation failed
              </h1>
              <p className="mt-2 text-slate-400">
                {errorMessage ?? "Something went wrong."}
              </p>
            </div>
            <Button
              type="button"
              onClick={goToProfile}
              className="h-11 rounded-full bg-emerald-500 px-6 text-slate-950 hover:bg-emerald-400"
            >
              Back to Profile
            </Button>
          </>
        )}

        {state === "polling" ? (
          <Link
            href={withLangParam("/profile", lang)}
            className="text-sm text-slate-500 transition hover:text-emerald-400"
          >
            Return to Profile
          </Link>
        ) : null}
      </div>

      <Dialog
        open={dialogOpen && (state === "succeeded" || state === "failed")}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open && state === "succeeded") goToProfile();
        }}
      >
        <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
          {state === "succeeded" ? (
            <>
              <DialogHeader>
                <DialogTitle>Payment method added</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Your card was confirmed successfully.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={goToProfile}
                  className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Back to Profile
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Confirmation failed</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {errorMessage ?? "Something went wrong."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    goToProfile();
                  }}
                  className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Back to Profile
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen && state === "timeout"}
        onOpenChange={(open) => {
          setDialogOpen(open);
        }}
      >
        <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Still confirming</DialogTitle>
            <DialogDescription className="text-slate-400">
              We&apos;re still confirming your payment method. Please check
              again shortly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setDialogOpen(false);
                goToProfile();
              }}
              className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              Back to Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserShell>
  );
}

export default function PaymentSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#030712] text-sm text-slate-400">
          Loading…
        </div>
      }
    >
      <PaymentSetupContent />
    </Suspense>
  );
}
