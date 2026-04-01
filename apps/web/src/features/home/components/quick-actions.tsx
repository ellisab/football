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
      glowClass:
        "from-[#ff9953]/24 via-[#ff5c9a]/18 to-transparent",
      iconClass:
        "bg-[linear-gradient(135deg,rgba(255,214,108,0.26),rgba(255,153,83,0.26),rgba(255,92,154,0.18))] text-[#fff6d0]",
      ctaClass: "text-[#ffd66c]",
    },
    {
      href: secondaryHref,
      icon: hasTable ? Medal : ScanEye,
      title: hasTable ? "Tabelle" : "Spielüberblick",
      description: hasTable
        ? "Sieh direkt, wer um Europa und gegen den Abstieg spielt."
        : "Überblicke kommende Duelle und die Dynamik der Runde.",
      cta: hasTable ? "Zur Tabelle" : "Zum Überblick",
      glowClass:
        "from-[#57ebff]/20 via-[#9d68ff]/14 to-transparent",
      iconClass:
        "bg-[linear-gradient(135deg,rgba(87,235,255,0.24),rgba(157,104,255,0.18),rgba(255,214,108,0.16))] text-[#d9fbff]",
      ctaClass: "text-[#57ebff]",
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
              className="poster-surface group relative grid min-h-[132px] gap-3 overflow-hidden rounded-[1.7rem] border-white/10 bg-[linear-gradient(180deg,rgba(39,14,47,0.88),rgba(22,9,31,0.96))] p-5 transition-all hover:-translate-y-0.5 hover:border-[#57ebff]/25 hover:bg-[linear-gradient(180deg,rgba(43,16,54,0.92),rgba(24,10,35,0.98))]"
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${action.glowClass} opacity-80 blur-2xl transition-opacity group-hover:opacity-100`}
              />
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 shadow-[0_10px_22px_rgba(7,3,13,0.24)] ${action.iconClass}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="relative z-10 grid gap-1">
                <div className="text-[1.35rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#fff6d0]">
                  {action.title}
                </div>
                <div className="text-sm text-[#e3b7cf]">{action.description}</div>
              </div>
              <div
                className={`relative z-10 inline-flex items-center gap-1 text-sm font-semibold ${action.ctaClass}`}
              >
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
