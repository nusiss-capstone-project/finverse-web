import { fetchJsonEnvelope } from "@/lib/api/fetch-json-envelope";
import type { StandardEnvelope } from "@/lib/api/public-api";
import { buildPublicApiUrl } from "@/lib/api/public-api";

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
