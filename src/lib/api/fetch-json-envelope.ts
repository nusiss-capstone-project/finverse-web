import type { StandardEnvelope } from "@/lib/api/public-api";
import { withClerkAuthorization } from "@/lib/auth/clerk-token";

export async function fetchJsonEnvelope<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<StandardEnvelope<T>> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  await withClerkAuthorization(url, headers);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as StandardEnvelope<T>;
}
