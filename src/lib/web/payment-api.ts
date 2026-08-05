import { fetchWithClerkAuthorization } from "@/lib/auth/clerk-token";
import { buildPublicApiUrl } from "@/lib/api/public-api";
import {
  asRecord,
  pickNullableNum,
  pickNum,
  pickStr,
} from "@/lib/web/api-field-utils";

/** `data.PaymentMethodVO` from payment-ms swagger. */
export type PaymentMethod = {
  id: number;
  brand: string;
  last4: string;
  type: string;
  status: string;
  paymentMethodId: string;
  createdAt: number | null;
};

/** `data.AddPaymentMethodResponse` */
export type AddPaymentMethodResult = {
  redirectUrl: string;
};

type PaymentEnvelope<T> = {
  code?: number;
  err_msg?: string;
  message?: string;
  data?: T;
};

function paymentErrorMessage(body: PaymentEnvelope<unknown>, fallback: string) {
  const msg = body.err_msg?.trim() || body.message?.trim();
  return msg || fallback;
}

export function isPaymentTransientError(err: unknown): boolean {
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

export function paymentApiErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Request failed";
}

async function fetchPaymentEnvelope<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = buildPublicApiUrl(path);
  const res = await fetchWithClerkAuthorization(url, init);
  let body: PaymentEnvelope<T>;
  try {
    body = (await res.json()) as PaymentEnvelope<T>;
  } catch {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  if (!res.ok) {
    throw new Error(
      paymentErrorMessage(body, `${res.status} ${res.statusText}`),
    );
  }
  if (body.code != null && body.code !== 0) {
    throw new Error(paymentErrorMessage(body, "Request failed"));
  }
  return body.data as T;
}

export function normalizePaymentMethod(raw: unknown): PaymentMethod | null {
  const o = asRecord(raw);
  if (!o) return null;
  const last4 = pickStr(o, ["last4", "last_4"]);
  const brand = pickStr(o, ["brand"]);
  const id = pickNum(o, ["id"]);
  if (!last4 && !brand && !id) return null;
  return {
    id,
    brand,
    last4,
    type: pickStr(o, ["type"]),
    status: pickStr(o, ["status"]),
    paymentMethodId: pickStr(o, ["payment_method_id", "paymentMethodId"]),
    createdAt: pickNullableNum(o, ["created_at", "createdAt"]),
  };
}

/**
 * GET `/payment-ms/v1/web/payment-methods`
 */
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const data = await fetchPaymentEnvelope<unknown>(
    "/payment-ms/v1/web/payment-methods",
    { method: "GET" },
  );
  if (!Array.isArray(data)) return [];
  return data
    .map(normalizePaymentMethod)
    .filter((m): m is PaymentMethod => m != null);
}

/**
 * Returns the first bound method, or null when the list is empty.
 */
export async function fetchPrimaryPaymentMethod(): Promise<PaymentMethod | null> {
  const methods = await fetchPaymentMethods();
  return methods[0] ?? null;
}

/**
 * POST `/payment-ms/v1/web/payment-methods`
 * Creates a Stripe setup checkout session. Redirect via `redirect_url`.
 */
export async function createPaymentMethodSetup(): Promise<AddPaymentMethodResult> {
  const data = await fetchPaymentEnvelope<unknown>(
    "/payment-ms/v1/web/payment-methods",
    { method: "POST" },
  );
  const o = asRecord(data);
  const redirectUrl = pickStr(o, ["redirect_url", "redirectUrl"]);
  if (!redirectUrl) {
    throw new Error("Setup URL missing from server response.");
  }
  return { redirectUrl };
}

export function formatCardBrand(brand: string): string {
  const trimmed = brand.trim();
  if (!trimmed) return "Card";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
