"use client";

import { ChevronDown } from "lucide-react";

type CampaignFaqSectionProps = {
  faq: Array<{ title: string; description: string }>;
};

export function CampaignFaqSection({ faq }: CampaignFaqSectionProps) {
  if (faq.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">FAQ</h2>
        <p className="mt-1 text-sm text-slate-400">
          Common questions about this campaign.
        </p>
      </div>

      <div className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] ring-1 ring-white/5">
        {faq.map((item, index) => (
          <details
            key={`${index}-${item.title}`}
            className="group"
            open={index === 0}
          >
            <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 text-left marker:content-none [&::-webkit-details-marker]:hidden sm:px-6">
              <span className="mt-0.5 shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                Q
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-white sm:text-base">
                {item.title || "Question"}
              </span>
              <ChevronDown className="mt-0.5 size-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex gap-3 border-t border-white/5 px-5 pb-5 pt-3 sm:px-6">
              <span className="mt-0.5 shrink-0 rounded-md bg-slate-500/20 px-2 py-0.5 text-xs font-bold text-slate-300">
                A
              </span>
              <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                {item.description || "—"}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
