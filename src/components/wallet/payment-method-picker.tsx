"use client";

import Link from "next/link";

import { withLangParam } from "@/components/user/user-shell";
import {
  formatCardBrand,
  type PaymentMethod,
} from "@/lib/web/payment-api";

export function PaymentMethodPicker({
  pmLoading,
  paymentMethods,
  selectedPmId,
  lang,
  disabled = false,
  onSelectPm,
}: Readonly<{
  pmLoading: boolean;
  paymentMethods: PaymentMethod[];
  selectedPmId: number | null;
  lang?: string;
  disabled?: boolean;
  onSelectPm: (id: number) => void;
}>) {
  if (pmLoading) {
    return <p className="text-sm text-slate-500">Loading cards…</p>;
  }

  if (paymentMethods.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No payment method on file.{" "}
        <Link
          href={withLangParam("/profile", lang)}
          className="text-emerald-400 underline underline-offset-2"
        >
          Add Payment Method
        </Link>
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {paymentMethods.map((pm) => (
        <li key={pm.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelectPm(pm.id)}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition disabled:opacity-50 ${
              selectedPmId === pm.id
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-white/10 bg-slate-900/50 hover:bg-white/5"
            }`}
          >
            <p className="font-semibold text-white">
              {formatCardBrand(pm.brand)}
              {pm.last4 ? (
                <span className="ml-2 font-mono text-slate-300">
                  •••• {pm.last4}
                </span>
              ) : null}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
