import { format, isValid, parseISO } from "date-fns";

export type CampaignLandingViewModel = {
  campaignId: number;
  title: string;
  subtitle: string;
  bannerUrl: string | null;
  terms: string;
  minTopUpLabel: string;
  rewardAmountLabel: string;
  eligibilityLabel: string;
  registrationPeriodLabel: string;
  campaignPeriodLabel: string;
  rewardDistributionLabel: string;
};

function pickStr(o: Record<string, unknown> | null, keys: string[]): string {
  if (!o) return "";
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function formatRange(start: string, end: string): string {
  if (!start || !end) return "—";
  const a = parseISO(start);
  const b = parseISO(end);
  if (!isValid(a) || !isValid(b)) return "—";
  return `${format(a, "MMM d, yyyy")} – ${format(b, "MMM d, yyyy")}`;
}

function formatMoney(n: number, currency?: string): string {
  try {
    const cur =
      currency && /^[A-Z]{3}$/i.test(currency) ? currency.toUpperCase() : "USD";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return String(n);
  }
}

/** Backend may send rewardRules as an object or a JSON string. */
function parseRewardRules(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    try {
      return asRecord(JSON.parse(s) as unknown);
    } catch {
      return null;
    }
  }
  return asRecord(raw);
}

function rewardRulesSource(
  campaign: Record<string, unknown> | null,
  root: Record<string, unknown>,
  landing: Record<string, unknown> | null,
): unknown {
  return (
    campaign?.rewardRule ??
    campaign?.reward_rule ??
    campaign?.rewardRules ??
    campaign?.reward_rules ??
    root.rewardRule ??
    root.reward_rule ??
    root.rewardRules ??
    root.reward_rules ??
    landing?.rewardRule ??
    landing?.reward_rule ??
    landing?.rewardRules ??
    landing?.reward_rules
  );
}

function pickNum(obj: Record<string, unknown> | null, keys: string[]): number {
  if (!obj) return NaN;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return NaN;
}

function pickRewardType(rr: Record<string, unknown> | null): string {
  if (!rr) return "";
  const v = rr.rewardType ?? rr.reward_type;
  if (typeof v === "string") return v.trim().toUpperCase();
  return "";
}

function pickRewardMode(rr: Record<string, unknown> | null): string {
  if (!rr) return "";
  const v = rr.rewardMode ?? rr.reward_mode;
  if (typeof v === "string") return v.trim().toUpperCase();
  return "";
}

function humanizeAudience(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  return s
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function buildCampaignLandingViewModel(
  campaignId: number,
  payload: unknown,
): CampaignLandingViewModel {
  const root = asRecord(payload) ?? {};
  const landing =
    asRecord(root.landingPage) ??
    asRecord(root.landing_page) ??
    root;
  const campaign = asRecord(root.campaign) ?? root;

  const title =
    pickStr(landing, ["title", "pageTitle"]) ||
    pickStr(campaign, ["name", "title"]) ||
    `Campaign ${campaignId}`;
  const subtitle =
    pickStr(landing, ["description", "subtitle", "summary", "body"]) ||
    pickStr(campaign, ["description", "subtitle"]) ||
    "";
  const bannerUrl =
    pickStr(landing, ["bannerImageUrl", "banner_image_url", "bannerUrl"]) ||
    null;
  const terms =
    pickStr(landing, ["terms", "termsHtml", "termsText", "terms_html"]) ||
    "";

  const rawRules = rewardRulesSource(campaign, root, landing);
  const rr = parseRewardRules(rawRules);

  let topNum = pickNum(rr, ["topupThreshold", "topup_threshold", "minTopUp"]);
  if (!Number.isFinite(topNum)) {
    topNum = pickNum(campaign, [
      "topupThreshold",
      "topup_threshold",
      "min_top_up",
    ]);
  }

  let rewardNum = pickNum(rr, ["rewardAmount", "reward_amount"]);
  if (!Number.isFinite(rewardNum)) {
    rewardNum = pickNum(campaign, ["rewardAmount", "reward_amount"]);
  }
  const rewardPercentage = pickNum(rr, [
    "rewardPercentage",
    "reward_percentage",
  ]);
  const maxRewardAmount = pickNum(rr, ["maxRewardAmount", "max_reward_amount"]);

  const maxClaimPerUser = pickNum(rr, [
    "maxClaimPerUser",
    "max_claim_per_user",
  ]);

  const cur =
    pickStr(rr, ["rewardCurrency", "reward_currency"]) ||
    pickStr(campaign, ["currency", "rewardCurrency"]);
  const currency = /^[A-Z]{3}$/i.test(cur) ? cur.toUpperCase() : "USD";

  const minTopUpLabel = Number.isFinite(topNum)
    ? formatMoney(topNum, currency)
    : "-";

  const rewardType =
    pickRewardType(rr) ||
    pickStr(campaign, ["rewardType", "reward_type"]).toUpperCase();
  const rewardMode = pickRewardMode(rr);
  const rewardAmountLabel =
    rewardMode === "PERCENTAGE"
      ? Number.isFinite(rewardPercentage)
        ? `${rewardPercentage}% bonus${
            Number.isFinite(maxRewardAmount)
              ? `, up to ${formatMoney(maxRewardAmount, currency)}`
              : ""
          }`
        : "-"
      : Number.isFinite(rewardNum)
        ? rewardType === "FIXED" || rewardMode === "FIXED_AMOUNT"
          ? `${formatMoney(rewardNum, currency)} bonus`
          : formatMoney(rewardNum, currency)
        : "-";

  const segmentRaw = pickStr(campaign, [
    "targetUserSegment",
    "target_user_segment",
  ]);
  const audienceHuman = humanizeAudience(segmentRaw);
  const eligibilityLabel = Number.isFinite(maxClaimPerUser)
    ? `${audienceHuman || "New users"}, max ${Math.trunc(maxClaimPerUser)} claims per user`
    : "-";

  const regStart = pickStr(campaign, [
    "registrationStartTime",
    "registration_start_time",
  ]);
  const regEnd = pickStr(campaign, [
    "registrationEndTime",
    "registration_end_time",
  ]);
  const campStart = pickStr(campaign, [
    "campaignStartTime",
    "campaign_start_time",
    "startTime",
  ]);
  const campEnd = pickStr(campaign, [
    "campaignEndTime",
    "campaign_end_time",
    "endTime",
  ]);

  const registrationPeriodLabel = formatRange(regStart, regEnd);
  const campaignPeriodLabel = formatRange(campStart, campEnd);

  const rewardDistributionLabel =
    pickStr(root, ["rewardDistributionNote", "reward_distribution_note"]) ||
    pickStr(campaign, ["rewardDistributionNote", "payoutNote"]) ||
    "Rewards are credited after successful qualification. Manual review may apply in some cases.";

  return {
    campaignId,
    title,
    subtitle,
    bannerUrl,
    terms,
    minTopUpLabel,
    rewardAmountLabel,
    eligibilityLabel,
    registrationPeriodLabel,
    campaignPeriodLabel,
    rewardDistributionLabel,
  };
}
