import { fetchJsonEnvelope } from "@/lib/api/fetch-json-envelope";
import type { StandardEnvelope } from "@/lib/api/public-api";
import { buildPublicApiUrl } from "@/lib/api/public-api";
import { fetchWithClerkAuthorization } from "@/lib/auth/clerk-token";
import {
  asRecord,
  pickNum,
  pickStr,
} from "@/lib/web/api-field-utils";

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

export async function postCampaignJoin(
  campaignId: number,
): Promise<StandardEnvelope<unknown>> {
  const url = buildPublicApiUrl(
    `/campaign-center-api/v1/web/campaigns/${campaignId}/join`,
  );
  return fetchJsonEnvelope(url, { method: "POST" });
}

export type CampaignRules = {
  id: number;
  taskGroupId: number;
  projectId: number;
};

export type CampaignTask = {
  id: number;
  name: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};

export type CampaignRewardRecord = {
  voucherId: string;
  voucherType: string;
  unit: string;
  rewardAmount: string;
  createdAt: string;
  status: string;
};

export function normalizeCampaignRules(raw: unknown): CampaignRules | null {
  const o = asRecord(raw);
  if (!o) return null;
  const taskGroupId = pickNum(o, [
    "taskGroupId",
    "task_group_id",
    "groupId",
    "group_id",
  ]);
  const projectId = pickNum(o, ["projectId", "project_id"]);
  if (!taskGroupId || !projectId) return null;
  return {
    id: pickNum(o, ["id"]),
    taskGroupId,
    projectId,
  };
}

export function normalizeCampaignTask(raw: unknown): CampaignTask | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = pickNum(o, ["id"]);
  if (!id) return null;
  return {
    id,
    name: pickStr(o, ["name"]),
    status: pickStr(o, ["status"]),
    createdAt: pickNum(o, ["created_at", "createdAt"]),
    updatedAt: pickNum(o, ["updated_at", "updatedAt"]),
  };
}

export function normalizeCampaignReward(
  raw: unknown,
): CampaignRewardRecord | null {
  const o = asRecord(raw);
  if (!o) return null;
  const voucherId = pickStr(o, ["voucher_id", "voucherId"]);
  if (!voucherId) return null;
  return {
    voucherId,
    voucherType: pickStr(o, ["voucher_type", "voucherType"]),
    unit: pickStr(o, ["unit"]),
    rewardAmount: pickStr(o, ["reward_amount", "rewardAmount"]),
    createdAt: pickStr(o, ["created_at", "createdAt"]),
    status: pickStr(o, ["status"]),
  };
}

export async function fetchCampaignRules(
  campaignId: number,
): Promise<CampaignRules> {
  const url = buildPublicApiUrl(
    `/campaign-center-api/v1/web/campaigns/${campaignId}/rules`,
  );
  const envelope = await fetchJsonEnvelope(url, { method: "GET" });
  if (envelope.code != null && envelope.code !== 0) {
    throw new Error(envelope.message ?? "Could not load campaign rules.");
  }
  const rules = normalizeCampaignRules(envelope.data);
  if (!rules) throw new Error("Invalid campaign rules response.");
  return rules;
}

async function fetchArrayPayload(url: string): Promise<unknown[]> {
  const res = await fetchWithClerkAuthorization(url, { method: "GET" });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  if (!res.ok) {
    const o = asRecord(body);
    const msg =
      pickStr(o, ["err_msg", "message"]) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  if (Array.isArray(body)) return body;

  const envelope = asRecord(body);
  if (!envelope) {
    throw new Error("Invalid list response.");
  }
  if (envelope.code != null && Number(envelope.code) !== 0) {
    throw new Error(
      pickStr(envelope, ["err_msg", "message"]) || "Request failed",
    );
  }
  if (Array.isArray(envelope.data)) return envelope.data;
  throw new Error("Invalid list response.");
}

export async function fetchCampaignTasks(
  taskGroupId: number,
): Promise<CampaignTask[]> {
  const url = buildPublicApiUrl(
    `/task-ms/v1/web/tasks/task_group/${encodeURIComponent(String(taskGroupId))}`,
  );
  const items = await fetchArrayPayload(url);
  return items
    .map(normalizeCampaignTask)
    .filter((item): item is CampaignTask => item != null);
}

export async function fetchCampaignRewards(
  projectId: number,
): Promise<CampaignRewardRecord[]> {
  const url = buildPublicApiUrl(
    `/reward-ms/v1/web/issue-records/projects/${encodeURIComponent(String(projectId))}`,
  );
  const items = await fetchArrayPayload(url);
  return items
    .map(normalizeCampaignReward)
    .filter((item): item is CampaignRewardRecord => item != null);
}
