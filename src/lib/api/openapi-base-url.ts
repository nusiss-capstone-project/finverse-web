import { getPublicApiBaseUrl } from "@/lib/api/public-api";

/** Origin only, no trailing slash — same contract as `getPublicApiBaseUrl`. */
export function getCampaignCenterApiV1Base(): string {
  const base = getPublicApiBaseUrl();
  if (base) {
    return `${base}/campaign-center-api/v1`;
  }
  return "http://localhost:8080/campaign-center-api/v1";
}
