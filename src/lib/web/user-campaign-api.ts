import type { api_SimulateTopUpReq } from "@/lib/api/models/api_SimulateTopUpReq";
import { fetchJsonEnvelope } from "@/lib/api/fetch-json-envelope";
import type { StandardEnvelope } from "@/lib/api/public-api";
import { buildPublicApiUrl } from "@/lib/api/public-api";
import { withClerkAuthorization } from "@/lib/auth/clerk-token";

export function buildCampaignLandingPageUrl(
  campaignId: number,
  query?: { lang?: string },
): string {
  const base = buildPublicApiUrl(
    `/campaign-center-api/v1/web/campaigns/${campaignId}/landing-page`,
  );
  const usp = new URLSearchParams();
  if (query?.lang?.trim()) {
    usp.set("lang", query.lang.trim());
  }
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function fetchCampaignLandingPage(
  campaignId: number,
  query?: { lang?: string },
): Promise<StandardEnvelope<unknown>> {
  const url = buildCampaignLandingPageUrl(campaignId, query);
  return fetchJsonEnvelope(url, { method: "GET" });
}

async function postWebEnvelope<T>(
  path: string,
  body?: unknown,
): Promise<StandardEnvelope<T>> {
  const url = buildPublicApiUrl(path);
  const headers = new Headers();
  const init: RequestInit = { method: "POST", headers };
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }
  await withClerkAuthorization(url, headers);
  const res = await fetch(url, init);
  const json = (await res.json()) as StandardEnvelope<T>;
  if (!res.ok) {
    throw new Error(json.message ?? `${res.status} ${res.statusText}`);
  }
  return json;
}

export async function postCampaignJoin(
  campaignId: number,
): Promise<StandardEnvelope<unknown>> {
  return postWebEnvelope(
    `/campaign-center-api/v1/web/campaigns/${campaignId}/join`,
  );
}

export async function postCampaignTopUp(
  campaignId: number,
  payload: api_SimulateTopUpReq,
): Promise<StandardEnvelope<unknown>> {
  return postWebEnvelope(
    `/campaign-center-api/v1/web/campaigns/${campaignId}/top-up`,
    payload,
  );
}
