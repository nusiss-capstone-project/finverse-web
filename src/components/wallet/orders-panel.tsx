"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderStatusBadge } from "@/components/wallet/order-status-badge";
import {
  WalletEmptyState,
  WalletFilterChips,
  WalletListError,
  WalletListSkeleton,
  WalletLoadMoreButton,
} from "@/components/wallet/wallet-list-ui";
import {
  assetApiErrorMessage,
  fetchOrderDetail,
  fetchOrders,
  formatAssetMoney,
  formatAssetQuantity,
  formatUnixTime,
  orderStatusLabel,
  type Order,
  type OrderStatus,
} from "@/lib/web/asset-api";

type OrderFilter = "all" | "pending" | "completed" | "failed";

const FILTER_OPTIONS: { value: OrderFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

function filterToStatus(filter: OrderFilter): OrderStatus | undefined {
  switch (filter) {
    case "pending":
      return "pending";
    case "completed":
      return "pay_succeed";
    case "failed":
      return "pay_fail";
    default:
      return undefined;
  }
}

type OrdersPanelProps = {
  highlightOrderId?: string | null;
};

export function OrdersPanel({
  highlightOrderId,
}: Readonly<OrdersPanelProps>) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadFirstPage = useCallback(async (nextFilter: OrderFilter) => {
    setLoading(true);
    setError(null);
    try {
      const status = filterToStatus(nextFilter);
      const result = await fetchOrders({ status, limit: 20 });
      setOrders(result.items);
      setNextCursor(result.nextCursor);
    } catch (e) {
      setOrders([]);
      setNextCursor(null);
      setError(assetApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage(filter);
  }, [filter, loadFirstPage]);

  const openDetail = useCallback(async (orderId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailOrder(null);
    try {
      setDetailOrder(await fetchOrderDetail(orderId));
    } catch (e) {
      setDetailOrder(null);
      setError(assetApiErrorMessage(e));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!highlightOrderId) return;
    void openDetail(highlightOrderId);
  }, [highlightOrderId, openDetail]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const status = filterToStatus(filter);
      const result = await fetchOrders({
        status,
        cursor: nextCursor,
        limit: 20,
      });
      setOrders((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (e) {
      setError(assetApiErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, filter]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <WalletFilterChips
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
        />

        {error && !loading ? (
          <WalletListError
            message={error}
            onRetry={() => void loadFirstPage(filter)}
          />
        ) : null}

        <OrdersListBody
          loading={loading}
          orders={orders}
          highlightOrderId={highlightOrderId}
          nextCursor={nextCursor}
          loadingMore={loadingMore}
          onSelectOrder={(orderId) => void openDetail(orderId)}
          onLoadMore={() => void loadMore()}
        />
      </div>

      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        order={detailOrder}
        loading={detailLoading}
      />
    </>
  );
}

function OrdersListBody({
  loading,
  orders,
  highlightOrderId,
  nextCursor,
  loadingMore,
  onSelectOrder,
  onLoadMore,
}: Readonly<{
  loading: boolean;
  orders: Order[];
  highlightOrderId?: string | null;
  nextCursor: string | null;
  loadingMore: boolean;
  onSelectOrder: (orderId: string) => void;
  onLoadMore: () => void;
}>) {
  if (loading) {
    return <WalletListSkeleton />;
  }

  if (orders.length === 0) {
    return <WalletEmptyState message="No orders found." />;
  }

  return (
    <>
      <ul className="grid gap-3">
        {orders.map((order) => (
          <OrderListItem
            key={order.orderId}
            order={order}
            highlighted={order.orderId === highlightOrderId}
            onSelect={() => onSelectOrder(order.orderId)}
          />
        ))}
      </ul>
      {nextCursor ? (
        <WalletLoadMoreButton loading={loadingMore} onClick={onLoadMore} />
      ) : null}
    </>
  );
}

function OrderListItem({
  order,
  highlighted,
  onSelect,
}: Readonly<{
  order: Order;
  highlighted: boolean;
  onSelect: () => void;
}>) {
  const assetName = order.asset?.name || "Asset";
  const symbol = order.asset?.symbol || "";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-[2rem] border p-4 text-left transition sm:p-5 ${
          highlighted
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-white/10 bg-slate-950/60 hover:bg-white/[0.03]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {order.asset?.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={order.asset.iconUrl}
                alt=""
                className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-xs font-bold text-emerald-400">
                {symbol.slice(0, 2) || "?"}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">
                {formatAssetQuantity(order.quantity)} {symbol}
              </p>
              <p className="mt-0.5 truncate text-sm text-slate-400">
                {assetName}
              </p>
            </div>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-emerald-400">
            {formatAssetMoney(order.payAmount, order.payCurrency)}
          </span>
          <span className="font-mono text-xs text-slate-600">{order.orderNo}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Qty {formatAssetQuantity(order.quantity)} ·{" "}
          {formatUnixTime(order.createdAt)}
        </p>
      </button>
    </li>
  );
}

function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  loading,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  loading: boolean;
}>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription className="text-slate-400">
            {order ? `Order ${order.orderNo}` : "Loading order…"}
          </DialogDescription>
        </DialogHeader>

        <OrderDetailBody loading={loading} order={order} />
      </DialogContent>
    </Dialog>
  );
}

function OrderDetailBody({
  loading,
  order,
}: Readonly<{
  loading: boolean;
  order: Order | null;
}>) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading…
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-slate-500">Order not found.</p>;
  }

  return (
    <div className="grid gap-3 text-sm">
      <DetailRow label="Status">
        <OrderStatusBadge status={order.status} />
      </DetailRow>
      <DetailRow label="Order number" value={order.orderNo} />
      <DetailRow
        label="Asset"
        value={
          order.asset
            ? `${order.asset.name} (${order.asset.symbol})`
            : order.assetId
        }
      />
      <DetailRow
        label="Quantity"
        value={formatAssetQuantity(order.quantity)}
      />
      <DetailRow
        label="Unit price"
        value={formatAssetMoney(order.unitPrice, order.payCurrency)}
      />
      <DetailRow
        label="Paid"
        value={formatAssetMoney(order.payAmount, order.payCurrency)}
        highlight
      />
      <DetailRow label="Created" value={formatUnixTime(order.createdAt)} />
      <DetailRow label="Status" value={orderStatusLabel(order.status)} />
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
  children,
}: Readonly<{
  label: string;
  value?: string;
  highlight?: boolean;
  children?: ReactNode;
}>) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <span className="text-slate-400">{label}</span>
      {children ?? (
        <span
          className={
            highlight
              ? "font-semibold text-emerald-400"
              : "font-medium text-white"
          }
        >
          {value}
        </span>
      )}
    </div>
  );
}
