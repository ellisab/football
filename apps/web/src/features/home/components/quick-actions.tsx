import { ArrowRight, Goal, Medal, ScanEye } from "lucide-react";

export function QuickActions({
  hasTable,
  primaryHref,
  secondaryHref,
}: {
  hasTable: boolean;
  primaryHref: string;
  secondaryHref: string;
}) {
  const actions = [
    {
      href: primaryHref,
      icon: Goal,
      title: "Latest Results",
      description: "Track every scoreline from first whistle to final.",
      cta: "Jump to matches",
    },
    {
      href: secondaryHref,
      icon: hasTable ? Medal : ScanEye,
      title: hasTable ? "Standings" : "Match Insights",
      description: hasTable
        ? "Jump straight to qualification and relegation pressure."
        : "Scan upcoming ties and in-round momentum.",
      cta: hasTable ? "Jump to table" : "Jump to insights",
    },
  ];

  return (
    <section className="grid gap-3">
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
        Quick Actions
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <a
              key={action.title}
              href={action.href}
              className="group grid min-h-[132px] gap-3 rounded-2xl border border-[#222530] bg-[#13161d] p-5 transition-colors hover:bg-[#161b26]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1a3a2a] text-[#3dffa0]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="grid gap-1">
                <div className="text-[1.35rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#ffffff]">
                  {action.title}
                </div>
                <div className="text-sm text-[#9ca6ba]">{action.description}</div>
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#3dffa0]">
                {action.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
