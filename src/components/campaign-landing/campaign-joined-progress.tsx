"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { CampaignRewardHistorySection } from "@/components/campaign-landing/campaign-reward-history-section";
import { CampaignTaskProgressSection } from "@/components/campaign-landing/campaign-task-progress-section";
import {
  fetchCampaignRewards,
  fetchCampaignRules,
  fetchCampaignTasks,
  type CampaignRewardRecord,
  type CampaignTask,
} from "@/lib/web/user-campaign-api";

function settledErrorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

function applySettledList<T>(
  result: PromiseSettledResult<T[]>,
  setItems: Dispatch<SetStateAction<T[]>>,
  setError: Dispatch<SetStateAction<string | null>>,
  fallback: string,
) {
  if (result.status === "fulfilled") {
    setItems(result.value);
    setError(null);
    return;
  }
  setItems([]);
  setError(settledErrorMessage(result.reason, fallback));
}

export function CampaignJoinedProgress({
  campaignId,
  joined,
}: Readonly<{ campaignId: number; joined: boolean }>) {
  const [tasks, setTasks] = useState<CampaignTask[]>([]);
  const [rewards, setRewards] = useState<CampaignRewardRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [rewardsError, setRewardsError] = useState<string | null>(null);

  useEffect(() => {
    if (!joined) {
      setTasks([]);
      setRewards([]);
      setTasksLoading(false);
      setRewardsLoading(false);
      setTasksError(null);
      setRewardsError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setTasksLoading(true);
      setRewardsLoading(true);
      setTasksError(null);
      setRewardsError(null);

      try {
        const rules = await fetchCampaignRules(campaignId);
        if (cancelled) return;

        const [taskResult, rewardResult] = await Promise.allSettled([
          fetchCampaignTasks(rules.taskGroupId),
          fetchCampaignRewards(rules.projectId),
        ]);
        if (cancelled) return;

        applySettledList(
          taskResult,
          setTasks,
          setTasksError,
          "Could not load tasks.",
        );
        applySettledList(
          rewardResult,
          setRewards,
          setRewardsError,
          "Could not load rewards.",
        );
      } catch (e) {
        if (cancelled) return;
        const msg = settledErrorMessage(
          e,
          "Could not load campaign progress.",
        );
        setTasks([]);
        setRewards([]);
        setTasksError(msg);
        setRewardsError(msg);
      } finally {
        if (!cancelled) {
          setTasksLoading(false);
          setRewardsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId, joined]);

  if (!joined) return null;

  return (
    <>
      <CampaignTaskProgressSection
        tasks={tasks}
        loading={tasksLoading}
        error={tasksError}
      />
      <CampaignRewardHistorySection
        rewards={rewards}
        loading={rewardsLoading}
        error={rewardsError}
      />
    </>
  );
}
