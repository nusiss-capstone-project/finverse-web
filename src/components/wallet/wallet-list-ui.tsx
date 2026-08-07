"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function WalletFilterChips<T extends string>({
  options,
  value,
  onChange,
}: Readonly<{
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "outline"}
            onClick={() => onChange(option.value)}
            className={
              active
                ? "rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                : "rounded-full border-white/10 bg-slate-950/60 text-slate-300 hover:bg-white/5"
            }
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

export function WalletListError({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="rounded-[2rem] border border-red-500/20 bg-red-950/40 p-6">
      <p className="text-sm text-red-200" role="alert">
        {message}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        className="mt-4 rounded-2xl border-white/10 text-white hover:bg-white/5"
      >
        Retry
      </Button>
    </div>
  );
}

export function WalletLoadMoreButton({
  loading,
  onClick,
}: Readonly<{ loading: boolean; onClick: () => void }>) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={onClick}
      className="mx-auto w-full max-w-xs rounded-2xl border-white/10 text-white hover:bg-white/5 sm:w-auto"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </>
      ) : (
        "Load More"
      )}
    </Button>
  );
}

export function WalletListSkeleton({
  count = 4,
}: Readonly<{ count?: number }>) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-[2rem] border border-white/10 bg-slate-950/60"
        />
      ))}
    </div>
  );
}

export function WalletEmptyState({
  message,
}: Readonly<{ message: string }>) {
  return (
    <p className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}
