"use client";

import { useState } from "react";

import { MyAssetsPanel } from "@/components/wallet/my-assets-panel";
import { OrdersPanel } from "@/components/wallet/orders-panel";
import { WalletTabs, type WalletTab } from "@/components/wallet/wallet-tabs";
import {
  UserShell,
  useLangFromQuery,
  useDemoUserId,
} from "@/components/user/user-shell";

export default function WalletPage() {
  const userId = useDemoUserId();
  const lang = useLangFromQuery();
  const [tab, setTab] = useState<WalletTab>("assets");
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  const switchToOrders = (orderId?: string) => {
    setTab("orders");
    setHighlightOrderId(orderId ?? null);
  };

  return (
    <UserShell userId={userId} lang={lang}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Wallet
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Manage your assets and purchase history.
          </p>
        </div>

        <WalletTabs
          value={tab}
          onChange={(next) => {
            setTab(next);
            if (next !== "orders") {
              setHighlightOrderId(null);
            }
          }}
        />

        {tab === "assets" ? (
          <MyAssetsPanel lang={lang} onSwitchToOrders={switchToOrders} />
        ) : (
          <OrdersPanel highlightOrderId={highlightOrderId} />
        )}
      </div>
    </UserShell>
  );
}
