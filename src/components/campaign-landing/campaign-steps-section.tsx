"use client";

type CampaignStepsSectionProps = {
  steps: Array<{ title: string; description: string }>;
};

export function CampaignStepsSection({ steps }: CampaignStepsSectionProps) {
  if (steps.length === 0) return null;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          How to complete
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Follow these steps in order to finish the campaign task.
        </p>
      </div>

      <ol className="relative m-0 list-none space-y-0 p-0">
        {steps.map((step, index) => {
          const stepNo = index + 1;
          const isLast = index === steps.length - 1;
          return (
            <li key={`${stepNo}-${step.title}`} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast ? (
                <span
                  className="absolute left-[1.15rem] top-10 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 to-white/10"
                  aria-hidden
                />
              ) : null}
              <div
                className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950 ring-4 ring-emerald-500/20"
                aria-hidden
              >
                {stepNo}
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/90">
                    Step {stepNo}/{steps.length}
                  </span>
                  {step.title ? (
                    <h3 className="text-base font-semibold text-white sm:text-lg">
                      {step.title}
                    </h3>
                  ) : null}
                </div>
                {step.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
