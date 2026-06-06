"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import type { api_SimulateTopUpReq } from "@/lib/api/models/api_SimulateTopUpReq";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { postCampaignJoin, postCampaignTopUp } from "@/lib/web/user-campaign-api";
import { interpretTopUpResponse } from "@/lib/web/top-up-result";
import type { CampaignToastState } from "@/components/campaign-landing/campaign-landing-toast";

const DEFAULT_TOP_UP_AMOUNT = 120;

type CampaignUserActionsSectionProps = {
  campaignId: number;
  onToast: (toast: CampaignToastState) => void;
};

export function CampaignUserActionsSection({
  campaignId,
  onToast,
}: CampaignUserActionsSectionProps) {
  const [topUpAmount, setTopUpAmount] = useState(String(DEFAULT_TOP_UP_AMOUNT));

  const [joining, setJoining] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultTitle, setResultTitle] = useState("");
  const [resultDescription, setResultDescription] = useState("");

  function parseTopUpAmount(): number | null {
    const n = Number(topUpAmount.trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  async function handleJoin() {
    setJoining(true);
    try {
      const res = await postCampaignJoin(campaignId);
      if (res.code != null && res.code !== 0) {
        onToast({
          open: true,
          variant: "error",
          message: res.message ?? "Could not join campaign.",
        });
        return;
      }
      onToast({
        open: true,
        variant: "success",
        message: res.message?.trim() || "Successfully joined the campaign.",
      });
    } catch (e) {
      onToast({
        open: true,
        variant: "error",
        message: e instanceof Error ? e.message : "Join failed.",
      });
    } finally {
      setJoining(false);
    }
  }

  async function handleTopUp() {
    const amount = parseTopUpAmount();
    if (amount == null) {
      onToast({
        open: true,
        variant: "error",
        message: "Enter a valid top-up amount (greater than 0).",
      });
      return;
    }
    setToppingUp(true);
    try {
      const body: api_SimulateTopUpReq = {
        amount,
      };
      const res = await postCampaignTopUp(campaignId, body);
      const ui = interpretTopUpResponse(res);
      setResultTitle(ui.title);
      setResultDescription(ui.description);
      setResultOpen(true);
    } catch (e) {
      setResultTitle("Request failed");
      setResultDescription(
        e instanceof Error ? e.message : "Top-up simulation failed.",
      );
      setResultOpen(true);
    } finally {
      setToppingUp(false);
    }
  }

  return (
    <>
      <section
        id="campaign-actions"
        className="scroll-mt-24 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-6 shadow-xl ring-1 ring-emerald-500/10 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Participate
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Join with your signed-in account or run a simulated top-up (amount
          defaults to {DEFAULT_TOP_UP_AMOUNT}).
        </p>
        <div className="mt-6 flex max-w-md flex-col gap-4">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-300">Top-up amount</span>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder={String(DEFAULT_TOP_UP_AMOUNT)}
              className="h-11 border-white/15 bg-slate-950/80 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500/40"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={joining}
              className="rounded-full bg-white px-6 text-slate-950 hover:bg-slate-200"
              onClick={() => void handleJoin()}
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Joining…
                </>
              ) : (
                "Join campaign"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={toppingUp}
              className="rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
              onClick={() => void handleTopUp()}
            >
              {toppingUp ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Simulating…
                </>
              ) : (
                "Simulate top-up"
              )}
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{resultTitle}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {resultDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-white/10 sm:justify-end">
            <Button
              type="button"
              className="rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              onClick={() => setResultOpen(false)}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
