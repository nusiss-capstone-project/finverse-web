"use client";

import { ChevronDown } from "lucide-react";

type CampaignTermsSectionProps = {
  terms: string;
};

export function CampaignTermsSection({ terms }: CampaignTermsSectionProps) {
  if (!terms.trim()) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] ring-1 ring-white/5">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5 text-left font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
          <span>Terms & conditions</span>
          <ChevronDown className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-white/10 px-6 pb-6 pt-2">
          <div className="max-h-[min(50vh,28rem)] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
            {terms}
          </div>
        </div>
      </details>
    </section>
  );
}
