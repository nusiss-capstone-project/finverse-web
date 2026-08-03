"use client";

type CampaignDescriptionSectionProps = {
  description: string;
};

export function CampaignDescriptionSection({
  description,
}: Readonly<CampaignDescriptionSectionProps>) {
  if (!description.trim()) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/5 sm:p-8">
      <h2 className="text-lg font-semibold text-white sm:text-xl">
        About this campaign
      </h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300 sm:text-base">
        {description}
      </p>
    </section>
  );
}
