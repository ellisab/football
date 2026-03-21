import { ArrowRight, Goal, Medal, ScanEye } from "lucide-react";
import { SectionKicker } from "./section-kicker";

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
      title: "Neueste Ergebnisse",
      description: "Verfolge jeden Spielstand vom Anpfiff bis zum Abpfiff.",
      cta: "Zu den Spielen",
    },
    {
      href: secondaryHref,
      icon: hasTable ? Medal : ScanEye,
      title: hasTable ? "Tabelle" : "Spielüberblick",
      description: hasTable
        ? "Sieh direkt, wer um Europa und gegen den Abstieg spielt."
        : "Überblicke kommende Duelle und die Dynamik der Runde.",
      cta: hasTable ? "Zur Tabelle" : "Zum Überblick",
    },
  ];

  return (
    <section className="grid gap-3">
      <SectionKicker>Schnellzugriff</SectionKicker>
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
