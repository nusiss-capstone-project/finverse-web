import { fetchWithClerkAuthorization } from "@/lib/auth/clerk-token";
import { buildPublicApiUrl } from "@/lib/api/public-api";
import {
  asRecord,
  pickNum,
  pickStr,
} from "@/lib/web/api-field-utils";

export const ASSET_CURRENCY = "USD";

export type AssetStatus = "active" | "inactive";

export type Asset = {
  id: string;
  name: string;
  symbol: string;
  iconUrl: string;
  currentPrice: string;
  currency: string;
  status: AssetStatus;
  createdAt: number;
  updatedAt: number;
};

export type Holding = {
  assetId: string;
  quantity: string;
  updatedAt: number;
  asset: {
    iconUrl: string;
    name: string;
    symbol: string;
  };
  valuation: {
    amount: string;
    currency: string;
    unitPrice: string;
  };
};

export type Quote = {
  quoteId: string;
  assetId: string;
  unitPrice: string;
  currency: string;
  expiresAt: number;
};

export type OrderStatus = "pending" | "pay_succeed" | "pay_fail";

export type OrderAsset = {
  assetId: string;
  name: string;
  symbol: string;
  iconUrl: string;
};

export type Order = {
  orderId: string;
  orderNo: string;
  status: OrderStatus;
  assetId: string;
  quantity: string;
  unitPrice: string;
  payAmount: string;
  payCurrency: string;
  paymentId: string;
  quoteId: string;
  createdAt: number;
  updatedAt: number;
  asset: OrderAsset | null;
};

export type OrderListResult = {
  items: Order[];
  nextCursor: string | null;
};

type AssetEnvelope<T> = {
  code?: number;
  err_msg?: string;
  message?: string;
  data?: T;
};

function assetErrorMessage(body: AssetEnvelope<unknown>, fallback: string) {
  const msg = body.err_msg?.trim() || body.message?.trim();
  return msg || fallback;
}

export function assetApiErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Request failed";
}

export function isAssetTransientError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed")
  );
}

async function fetchAssetEnvelope<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = buildPublicApiUrl(path);
  const res = await fetchWithClerkAuthorization(url, init);
  let body: AssetEnvelope<T>;
  try {
    body = (await res.json()) as AssetEnvelope<T>;
  } catch {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  if (!res.ok) {
    throw new Error(
      assetErrorMessage(body, `${res.status} ${res.statusText}`),
    );
  }
  if (body.code != null && body.code !== 0) {
    throw new Error(assetErrorMessage(body, "Request failed"));
  }
  return body.data as T;
}

function normalizeAssetStatus(raw: string): AssetStatus {
  return raw.trim().toLowerCase() === "inactive" ? "inactive" : "active";
}

function normalizeOrderStatus(raw: string): OrderStatus {
  const s = raw.trim().toLowerCase();
  if (s === "pay_succeed" || s === "pay_fail" || s === "pending") return s;
  return "pending";
}

export function normalizeAsset(raw: unknown): Asset | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = pickStr(o, ["id"]);
  if (!id) return null;
  return {
    id,
    name: pickStr(o, ["name"]),
    symbol: pickStr(o, ["symbol"]),
    iconUrl: pickStr(o, ["icon_url", "iconUrl"]),
    currentPrice: pickStr(o, ["current_price", "currentPrice"]) || "0",
    currency: pickStr(o, ["currency"]) || ASSET_CURRENCY,
    status: normalizeAssetStatus(pickStr(o, ["status"])),
    createdAt: pickNum(o, ["created_at", "createdAt"]),
    updatedAt: pickNum(o, ["updated_at", "updatedAt"]),
  };
}

function normalizeNestedAsset(raw: unknown): Holding["asset"] {
  const o = asRecord(raw);
  if (!o) {
    return { iconUrl: "", name: "", symbol: "" };
  }
  return {
    iconUrl: pickStr(o, ["icon_url", "iconUrl"]),
    name: pickStr(o, ["name"]),
    symbol: pickStr(o, ["symbol"]),
  };
}

function normalizeValuation(raw: unknown): Holding["valuation"] {
  const o = asRecord(raw);
  if (!o) {
    return { amount: "0", currency: ASSET_CURRENCY, unitPrice: "0" };
  }
  return {
    amount: pickStr(o, ["amount"]) || "0",
    currency: pickStr(o, ["currency"]) || ASSET_CURRENCY,
    unitPrice: pickStr(o, ["unit_price", "unitPrice"]) || "0",
  };
}

export function normalizeHolding(raw: unknown): Holding | null {
  const o = asRecord(raw);
  if (!o) return null;
  const assetId = pickStr(o, ["asset_id", "assetId"]);
  if (!assetId) return null;
  return {
    assetId,
    quantity: pickStr(o, ["quantity"]) || "0",
    updatedAt: pickNum(o, ["updated_at", "updatedAt"]),
    asset: normalizeNestedAsset(o.asset),
    valuation: normalizeValuation(o.valuation),
  };
}

export function normalizeQuote(raw: unknown): Quote | null {
  const o = asRecord(raw);
  if (!o) return null;
  const quoteId = pickStr(o, ["quote_id", "quoteId"]);
  const assetId = pickStr(o, ["asset_id", "assetId"]);
  if (!quoteId || !assetId) return null;
  return {
    quoteId,
    assetId,
    unitPrice: pickStr(o, ["unit_price", "unitPrice"]),
    currency: pickStr(o, ["currency"]) || ASSET_CURRENCY,
    expiresAt: pickNum(o, ["expires_at", "expiresAt"]),
  };
}

export function normalizeOrderAsset(raw: unknown): OrderAsset | null {
  const o = asRecord(raw);
  if (!o) return null;
  const assetId = pickStr(o, ["asset_id", "assetId", "id"]);
  if (!assetId && !pickStr(o, ["symbol"])) return null;
  return {
    assetId,
    name: pickStr(o, ["name"]),
    symbol: pickStr(o, ["symbol"]),
    iconUrl: pickStr(o, ["icon_url", "iconUrl"]),
  };
}

export function normalizeOrder(raw: unknown): Order | null {
  const o = asRecord(raw);
  if (!o) return null;
  const orderId = pickStr(o, ["order_id", "orderId", "id"]);
  if (!orderId) return null;
  const nestedAsset = normalizeOrderAsset(o.asset);
  return {
    orderId,
    orderNo: pickStr(o, ["order_no", "orderNo"]) || orderId,
    status: normalizeOrderStatus(pickStr(o, ["status"])),
    assetId: pickStr(o, ["asset_id", "assetId"]) || nestedAsset?.assetId || "",
    quantity: pickStr(o, ["quantity"]) || "0",
    unitPrice: pickStr(o, ["unit_price", "unitPrice"]) || "0",
    payAmount: pickStr(o, ["pay_amount", "payAmount"]) || "0",
    payCurrency: pickStr(o, ["pay_currency", "payCurrency"]) || ASSET_CURRENCY,
    paymentId: pickStr(o, ["payment_id", "paymentId"]),
    quoteId: pickStr(o, ["quote_id", "quoteId"]),
    createdAt: pickNum(o, ["created_at", "createdAt"]),
    updatedAt: pickNum(o, ["updated_at", "updatedAt"]),
    asset: nestedAsset,
  };
}

function normalizeOrderList(raw: unknown): OrderListResult {
  const o = asRecord(raw);
  let itemsRaw: unknown[] = [];
  if (Array.isArray(o?.items)) {
    itemsRaw = o.items;
  } else if (Array.isArray(raw)) {
    itemsRaw = raw;
  }
  const items = itemsRaw
    .map(normalizeOrder)
    .filter((item): item is Order => item != null);
  const nextCursor = pickStr(o, ["next_cursor", "nextCursor"]) || null;
  return { items, nextCursor: nextCursor || null };
}

export async function fetchAssets(status?: string): Promise<Asset[]> {
  const params = new URLSearchParams({ currency: ASSET_CURRENCY });
  if (status?.trim()) params.set("status", status.trim());
  const data = await fetchAssetEnvelope<unknown>(
    `/asset-ms/v1/web/assets?${params.toString()}`,
    { method: "GET" },
  );
  if (!Array.isArray(data)) return [];
  return data
    .map(normalizeAsset)
    .filter((item): item is Asset => item != null);
}

export async function fetchHoldings(): Promise<Holding[]> {
  const data = await fetchAssetEnvelope<unknown>(
    "/asset-ms/v1/web/holdings",
    { method: "GET" },
  );
  const o = asRecord(data);
  const items = Array.isArray(o?.items) ? o.items : [];
  return items
    .map(normalizeHolding)
    .filter((item): item is Holding => item != null);
}

export async function createQuote(assetId: string): Promise<Quote> {
  const data = await fetchAssetEnvelope<unknown>(
    "/asset-ms/v1/web/quotes",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset_id: assetId, currency: ASSET_CURRENCY }),
    },
  );
  const quote = normalizeQuote(data);
  if (!quote) throw new Error("Invalid quote response.");
  return quote;
}

export async function createOrder(input: {
  quoteId: string;
  quantity: string;
  paymentMethodId: number;
  idempotencyKey: string;
}): Promise<Order> {
  const data = await fetchAssetEnvelope<unknown>(
    "/asset-ms/v1/web/orders",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quote_id: input.quoteId,
        quantity: input.quantity,
        payment_method_id: input.paymentMethodId,
        idempotency_key: input.idempotencyKey,
      }),
    },
  );
  const order = normalizeOrder(data);
  if (!order) throw new Error("Invalid order response.");
  return order;
}

export async function fetchOrders(params?: {
  status?: OrderStatus;
  cursor?: string;
  limit?: number;
}): Promise<OrderListResult> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.cursor) search.set("cursor", params.cursor);
  if (params?.limit != null) search.set("limit", String(params.limit));
  const qs = search.toString();
  const path = qs
    ? `/asset-ms/v1/web/orders?${qs}`
    : "/asset-ms/v1/web/orders";
  const data = await fetchAssetEnvelope<unknown>(path, { method: "GET" });
  return normalizeOrderList(data);
}

export async function fetchOrderDetail(orderId: string): Promise<Order> {
  const data = await fetchAssetEnvelope<unknown>(
    `/asset-ms/v1/web/orders/${encodeURIComponent(orderId)}`,
    { method: "GET" },
  );
  const order = normalizeOrder(data);
  if (!order) throw new Error("Invalid order detail response.");
  return order;
}

export function formatAssetMoney(amount: string, currency = ASSET_CURRENCY): string {
  const cur = currency.trim().toUpperCase() || ASSET_CURRENCY;
  const trimmed = amount.trim();
  if (!trimmed) return `0.00 ${cur}`;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return `${trimmed} ${cur}`;
  return (
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n) + ` ${cur}`
  );
}

export function formatAssetQuantity(quantity: string): string {
  const trimmed = quantity.trim();
  if (!trimmed) return "0";
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return trimmed;
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(n);
}

export function formatUnixTime(unixSeconds: number): string {
  if (!unixSeconds) return "—";
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function isOrderTerminal(status: OrderStatus): boolean {
  return status === "pay_succeed" || status === "pay_fail";
}

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pay_succeed":
      return "Completed";
    case "pay_fail":
      return "Failed";
    case "pending":
      return "Pending";
    default:
      return status;
  }
}

export type AssetRow = Asset & {
  holdingQuantity: string;
  holdingValue: string;
  holdingCurrency: string;
};

export function mergeAssetsWithHoldings(
  assets: Asset[],
  holdings: Holding[],
): AssetRow[] {
  const holdingByAsset = new Map(holdings.map((h) => [h.assetId, h]));
  return assets.map((asset) => {
    const holding = holdingByAsset.get(asset.id);
    return {
      ...asset,
      holdingQuantity: holding?.quantity ?? "0",
      holdingValue: holding?.valuation.amount ?? "0",
      holdingCurrency: holding?.valuation.currency ?? asset.currency,
    };
  });
}
