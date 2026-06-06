import { UserAccountService } from "@/lib/api/services/UserAccountService";
import type { data_StandardResponse } from "@/lib/api/models/data_StandardResponse";
import { ApiError } from "@/lib/api/core/ApiError";
import { buildPublicApiUrl } from "@/lib/api/public-api";
import { fetchWithClerkAuthorization } from "@/lib/auth/clerk-token";

export const DEFAULT_WEB_USER_ID = 10001;
export const DEFAULT_WEB_CURRENCY = "USDT";

export type WalletSummary = {
  availableBalance: number;
  campaignRewards: number;
  totalRecharged: number;
  currency: string;
};

export type WalletTransaction = {
  id: number | null;
  transactionNo: string;
  type: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  balanceAfter: number | null;
  createdAt: string;
};

export type WalletTransactionsResult = {
  rows: WalletTransaction[];
  nextCursor: number | null;
  total: number | null;
};

export type UserCampaignCard = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  joined?: boolean;
};

export type UserCampaignGroups = {
  ongoing: UserCampaignCard[];
  upcoming: UserCampaignCard[];
};

export type UserProfile = {
  email: string;
  kycChecked: boolean;
  registeredAt: string;
  username: string;
};

function unwrap<T>(body: data_StandardResponse): T {
  if (body.code != null && body.code !== 0) {
    throw new Error(body.message ?? "Request failed");
  }
  return body.data as T;
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const msg = err.body?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
    return `${err.status} ${err.statusText}`;
  }
  return err instanceof Error ? err.message : "Request failed";
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function pickStr(o: Record<string, unknown> | null, keys: string[]): string {
  if (!o) return "";
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function pickNum(o: Record<string, unknown> | null, keys: string[]): number {
  if (!o) return 0;
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function pickNullableNum(
  o: Record<string, unknown> | null,
  keys: string[],
): number | null {
  if (!o) return null;
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function pickBool(o: Record<string, unknown> | null, keys: string[]): boolean {
  if (!o) return false;
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "boolean") return v;
    if (typeof v === "string" && v.trim()) {
      const normalized = v.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }
  return false;
}

export function formatMoney(amount: number, currency = DEFAULT_WEB_CURRENCY) {
  const cur = /^[A-Z]{3,5}$/i.test(currency) ? currency.toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${cur}`;
  } catch {
    return `${amount} ${cur}`;
  }
}

export function formatDateTime(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function normalizeWalletSummary(data: unknown): WalletSummary {
  const o = asRecord(data);
  return {
    availableBalance: pickNum(o, [
      "availableBalance",
      "available_balance",
      "balance",
    ]),
    campaignRewards: pickNum(o, [
      "campaignRewards",
      "campaignRewardAmount",
      "totalCampaignRewardAmount",
      "totalCampaignRewards",
      "rewardAmount",
      "reward_amount",
    ]),
    totalRecharged: pickNum(o, [
      "totalRecharged",
      "totalRechargeAmount",
      "rechargedAmount",
      "rechargeAmount",
      "total_recharged",
    ]),
    currency: pickStr(o, ["currency"]) || DEFAULT_WEB_CURRENCY,
  };
}

export function normalizeTransactions(data: unknown): WalletTransactionsResult {
  const o = asRecord(data);
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(o?.items)
      ? (o.items as unknown[])
      : Array.isArray(o?.records)
        ? (o.records as unknown[])
        : [];

  const rows = rawItems.map((item, index): WalletTransaction => {
    const row = asRecord(item);
    const type = pickStr(row, ["type", "transactionType", "transaction_type"]);
    const transactionNo =
      pickStr(row, ["transactionNo", "transaction_no", "txNo", "id"]) ||
      `TX-${index + 1}`;
    const amount = pickNum(row, ["amount", "transactionAmount"]);
    const currency = pickStr(row, ["currency"]) || DEFAULT_WEB_CURRENCY;
    return {
      id: pickNullableNum(row, ["id", "transactionId", "transaction_id"]),
      transactionNo,
      type,
      title: type.replace(/_/g, " ") || "Transaction",
      amount,
      currency,
      status: pickStr(row, ["status", "transactionStatus"]) || "Completed",
      balanceAfter: pickNullableNum(row, [
        "balanceAfter",
        "balance_after",
        "afterBalance",
      ]),
      createdAt: pickStr(row, ["createdAt", "created_at", "time", "joinAt"]),
    };
  });

  const total = pickNullableNum(o, ["total", "totalCount"]);
  const explicitNextCursor = pickNullableNum(o, [
    "nextCursor",
    "next_cursor",
    "cursor",
  ]);
  const nextCursor =
    explicitNextCursor ?? (rows.length > 0 ? rows[rows.length - 1].id : null);

  return { rows, nextCursor, total };
}

export async function fetchWalletSummary(
  _userId: number,
  currency = DEFAULT_WEB_CURRENCY,
): Promise<WalletSummary> {
  const body = await UserAccountService.getWebAccountSummary(currency);
  return normalizeWalletSummary(unwrap<unknown>(body));
}

export async function fetchWalletTransactions(params: {
  userId: number;
  type?: string;
  cursor?: number;
  limit?: number;
}): Promise<WalletTransactionsResult> {
  const body = await UserAccountService.getWebAccountTransactions(
    params.type,
    params.cursor,
    params.limit,
  );
  return normalizeTransactions(unwrap<unknown>(body));
}

function normalizeCampaignCard(data: unknown): UserCampaignCard | null {
  const o = asRecord(data);
  const id = pickNullableNum(o, ["id", "campaignId", "campaign_id"]);
  const name = pickStr(o, ["name", "title"]);
  if (id == null || !name) return null;

  return {
    id,
    name,
    startTime: pickStr(o, ["startTime", "start_time"]),
    endTime: pickStr(o, ["endTime", "end_time"]),
    joined: o && "joined" in o ? pickBool(o, ["joined"]) : undefined,
  };
}

function normalizeCampaignGroup(data: unknown): UserCampaignCard[] {
  const items = Array.isArray(data) ? data : [];
  return items
    .map((item) => normalizeCampaignCard(item))
    .filter((item): item is UserCampaignCard => item != null);
}

export function normalizeUserCampaignGroups(data: unknown): UserCampaignGroups {
  const o = asRecord(data);
  return {
    ongoing: normalizeCampaignGroup(o?.ongoing),
    upcoming: normalizeCampaignGroup(o?.upcoming),
  };
}

function userCampaignsUrl(): string {
  const client = (process.env.NEXT_PUBLIC_CLIENT ?? "web").trim() || "web";
  return buildPublicApiUrl(
    `/campaign-center-api/v1/${encodeURIComponent(client)}/campaigns`,
  );
}

export async function fetchUserCampaignGroups(): Promise<UserCampaignGroups> {
  const res = await fetchWithClerkAuthorization(userCampaignsUrl());
  const body = (await res.json()) as data_StandardResponse;
  if (!res.ok) {
    throw new Error(body.message ?? `${res.status} ${res.statusText}`);
  }
  return normalizeUserCampaignGroups(unwrap<unknown>(body));
}

export function normalizeUserProfile(data: unknown): UserProfile {
  const o = asRecord(data);
  return {
    email: pickStr(o, ["email"]),
    kycChecked: pickBool(o, ["kycChecked", "kyc_checked"]),
    registeredAt: pickStr(o, ["registeredAt", "registered_at"]),
    username: pickStr(o, ["username"]),
  };
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetchWithClerkAuthorization(
    buildPublicApiUrl("/campaign-center-api/v1/web/user-profile"),
  );
  const body = (await res.json()) as data_StandardResponse;
  if (!res.ok) {
    throw new Error(body.message ?? `${res.status} ${res.statusText}`);
  }
  return normalizeUserProfile(unwrap<unknown>(body));
}
