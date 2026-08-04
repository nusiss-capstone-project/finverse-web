"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { ReactNode } from "react";

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

    const stopPolling = () => {
      stoppedRef.current = true;
      if (intervalIdRef.current != null) {
        window.clearInterval(intervalIdRef.current);
      }
    };

    const complete = (next: SetupState, message?: string) => {
      stopPolling();
      if (message) setErrorMessage(message);
      setState(next);
      setDialogOpen(true);
    };

    const timedOut = () => Date.now() - startedAt >= POLL_TIMEOUT_MS;

    const pollOnce = async () => {
      if (stoppedRef.current || inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const method = await fetchPrimaryPaymentMethod();
        if (stoppedRef.current) return;
        if (method) {
          complete("succeeded");
          return;
        }
        if (timedOut()) complete("timeout");
      } catch (e) {
        if (stoppedRef.current) return;
        if (isPaymentTransientError(e)) {
          if (timedOut()) complete("timeout");
          return;
        }
        complete("failed", paymentApiErrorMessage(e));
      } finally {
        inFlightRef.current = false;
      }
    };

    void pollOnce();
    intervalIdRef.current = window.setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [cancelled]);

  return (
    <UserShell userId={userId} lang={lang}>
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 text-center">
        <SetupStatusPanel
          state={state}
          errorMessage={errorMessage}
          onBackToProfile={goToProfile}
        />
        {state === "polling" ? (
          <Link
            href={withLangParam("/profile", lang)}
            className="text-sm text-slate-500 transition hover:text-emerald-400"
          >
            Return to Profile
          </Link>
        ) : null}
      </div>

      <SetupResultDialogs
        state={state}
        dialogOpen={dialogOpen}
        errorMessage={errorMessage}
        onDialogOpenChange={setDialogOpen}
        onBackToProfile={goToProfile}
      />
    </UserShell>
  );
}

function SetupStatusPanel({
  state,
  errorMessage,
  onBackToProfile,
}: Readonly<{
  state: SetupState;
  errorMessage: string | null;
  onBackToProfile: () => void;
}>) {
  switch (state) {
    case "cancelled":
      return (
        <StatusBlock
          tone="amber"
          icon={<XCircle className="size-8" aria-hidden />}
          title="Setup cancelled"
          description="You left Stripe before finishing. No payment method was added."
          actionLabel="Back to Profile"
          onAction={onBackToProfile}
        />
      );
    case "polling":
      return (
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
      );
    case "succeeded":
      return (
        <StatusBlock
          tone="emerald"
          icon={<CheckCircle2 className="size-8" aria-hidden />}
          title="Payment method added"
          description="Your card is ready to use."
        />
      );
    case "timeout":
      return (
        <StatusBlock
          tone="amber"
          icon={<Loader2 className="size-10 text-amber-300" aria-hidden />}
          title="Still confirming"
          description="We're still confirming your payment method. Please check again shortly."
          actionLabel="Back to Profile"
          onAction={onBackToProfile}
          bareIcon
        />
      );
    case "failed":
      return (
        <StatusBlock
          tone="red"
          icon={<XCircle className="size-8" aria-hidden />}
          title="Confirmation failed"
          description={errorMessage ?? "Something went wrong."}
          actionLabel="Back to Profile"
          onAction={onBackToProfile}
        />
      );
    default:
      return null;
  }
}

function StatusBlock({
  tone,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  bareIcon = false,
}: Readonly<{
  tone: "amber" | "emerald" | "red";
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  bareIcon?: boolean;
}>) {
  const toneClassByTone = {
    emerald: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
    red: "bg-red-500/15 text-red-300 ring-red-500/25",
    amber: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  } as const;
  const toneClass = toneClassByTone[tone];

  return (
    <>
      {bareIcon ? (
        icon
      ) : (
        <span
          className={`flex size-16 items-center justify-center rounded-full ring-1 ${toneClass}`}
        >
          {icon}
        </span>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 text-slate-400">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button
          type="button"
          onClick={onAction}
          className="h-11 rounded-full bg-emerald-500 px-6 text-slate-950 hover:bg-emerald-400"
        >
          {actionLabel}
        </Button>
      ) : null}
    </>
  );
}

function SetupResultDialogs({
  state,
  dialogOpen,
  errorMessage,
  onDialogOpenChange,
  onBackToProfile,
}: Readonly<{
  state: SetupState;
  dialogOpen: boolean;
  errorMessage: string | null;
  onDialogOpenChange: (open: boolean) => void;
  onBackToProfile: () => void;
}>) {
  const showOutcome =
    dialogOpen && (state === "succeeded" || state === "failed");
  const showTimeout = dialogOpen && state === "timeout";

  return (
    <>
      <Dialog
        open={showOutcome}
        onOpenChange={(open) => {
          onDialogOpenChange(open);
          if (!open && state === "succeeded") onBackToProfile();
        }}
      >
        <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
          {state === "succeeded" ? (
            <OutcomeDialogBody
              title="Payment method added"
              description="Your card was confirmed successfully."
              onConfirm={onBackToProfile}
            />
          ) : (
            <OutcomeDialogBody
              title="Confirmation failed"
              description={errorMessage ?? "Something went wrong."}
              onConfirm={() => {
                onDialogOpenChange(false);
                onBackToProfile();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTimeout} onOpenChange={onDialogOpenChange}>
        <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
          <OutcomeDialogBody
            title="Still confirming"
            description="We're still confirming your payment method. Please check again shortly."
            onConfirm={() => {
              onDialogOpenChange(false);
              onBackToProfile();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function OutcomeDialogBody({
  title,
  description,
  onConfirm,
}: Readonly<{
  title: string;
  description: string;
  onConfirm: () => void;
}>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="text-slate-400">
          {description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
        >
          Back to Profile
        </Button>
      </DialogFooter>
    </>
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
