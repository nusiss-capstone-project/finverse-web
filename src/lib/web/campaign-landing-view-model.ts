import {
  asRecord,
  pickBool,
  pickStr,
} from "@/lib/web/api-field-utils";

export type CampaignLandingRepeatableItem = {
  title: string;
  description: string;
};

export type CampaignLandingViewModel = {
  campaignId: number;
  title: string;
  description: string;
  bannerUrl: string | null;
  terms: string;
  steps: CampaignLandingRepeatableItem[];
  faq: CampaignLandingRepeatableItem[];
  joined: boolean;
};

/** Maps `data.LandingPageRepeatableItemVO` (title + description). */
function normalizeRepeatableItems(
  raw: unknown,
): CampaignLandingRepeatableItem[] {
  if (!Array.isArray(raw)) return [];
  const items: CampaignLandingRepeatableItem[] = [];
  for (const entry of raw) {
    const o = asRecord(entry);
    if (!o) continue;
    const title = pickStr(o, ["title"]);
    const description = pickStr(o, ["description"]);
    if (!title && !description) continue;
    items.push({ title, description });
  }
  return items;
}

/**
 * Builds UI model from `data.WebCampaignLandingPageData`
 * (`landingPage` → `data.WebLandingPageContent`).
 */
export function buildCampaignLandingViewModel(
  campaignId: number,
  payload: unknown,
): CampaignLandingViewModel {
  const root = asRecord(payload) ?? {};
  const landing =
    asRecord(root.landingPage) ??
    asRecord(root.landing_page) ??
    root;

  const title =
    pickStr(landing, ["title"]) ||
    pickStr(root, ["name", "title"]) ||
    `Campaign ${campaignId}`;
  const description = pickStr(landing, ["description"]);
  const bannerUrl =
    pickStr(landing, ["bannerImageUrl", "banner_image_url", "bannerUrl"]) ||
    null;
  const terms = pickStr(landing, ["terms"]);
  const steps = normalizeRepeatableItems(landing?.steps);
  const faq = normalizeRepeatableItems(landing?.faq);
  const joined = pickBool(root, [
    "joined",
    "hasJoined",
    "has_joined",
    "isJoined",
    "is_joined",
  ]);

  return {
    campaignId,
    title,
    description,
    bannerUrl,
    terms,
    steps,
    faq,
    joined,
  };
}
