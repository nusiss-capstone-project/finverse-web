"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type WalletTab = "assets" | "orders";

type WalletTabsProps = {
  value: WalletTab;
  onChange: (tab: WalletTab) => void;
};

export function WalletTabs({ value, onChange }: WalletTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as WalletTab)}
      className="gap-6"
    >
      <TabsList className="h-auto w-full rounded-2xl border border-white/10 bg-slate-950/60 p-1.5 sm:w-fit">
        <TabsTrigger
          value="assets"
          className="flex-1 rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-400 data-active:bg-emerald-500 data-active:text-slate-950 data-active:shadow-lg data-active:shadow-emerald-500/20 sm:flex-none sm:px-8"
        >
          My Assets
        </TabsTrigger>
        <TabsTrigger
          value="orders"
          className="flex-1 rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-400 data-active:bg-emerald-500 data-active:text-slate-950 data-active:shadow-lg data-active:shadow-emerald-500/20 sm:flex-none sm:px-8"
        >
          Orders
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
