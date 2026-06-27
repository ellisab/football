import Link from "next/link";
import type { ReactNode } from "react";
import { PRIMARY_NAV_ITEMS } from "@/features/football/competition-meta";
import { ArrowLeft, Radio } from "lucide-react";

export function RouteFrame({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="poster-shell min-h-screen w-full text-[#edf6ef]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050a0d]/84 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-semibold text-[#edf6ef] transition-colors hover:border-[#dcbc6e]/40 hover:bg-white/[0.09]"
          >
            <ArrowLeft className="h-4 w-4 text-[#72d9e4]" />
            Start
          </Link>
          <nav
            aria-label="Hauptnavigation"
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="inline-flex shrink-0 items-center rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-[#a9c0b6] transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-[#edf6ef]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="hidden items-center gap-1.5 rounded-full border border-[#72d9e4]/25 bg-[#0c2f36]/55 px-3 py-2 text-xs font-bold text-[#c6f7fb] sm:inline-flex">
            <Radio className="h-3.5 w-3.5" />
            Live
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1240px] gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <section className="poster-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#071416]/88 p-5 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(220,188,110,0.85),rgba(114,217,228,0.75),transparent)]" />
          <div className="max-w-[52rem]">
            <div className="section-kicker">{eyebrow}</div>
            <h1 className="mt-3 text-[2.8rem] leading-[0.88] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] sm:text-[4.4rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-[64ch] text-sm leading-6 text-[#a9c0b6] sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </section>

        {children}
      </main>
    </div>
  );
}
