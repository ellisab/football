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
    <div className="poster-shell min-h-screen w-full text-[#f2f7f2]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030708]/84 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-semibold text-[#f2f7f2] transition-colors hover:border-[#d8b86a]/40 hover:bg-white/[0.09]"
          >
            <ArrowLeft className="h-4 w-4 text-[#6eeaf2]" />
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
                className="inline-flex shrink-0 items-center rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-[#a8bbb2] transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-[#f2f7f2]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="hidden items-center gap-1.5 rounded-full border border-[#6eeaf2]/25 bg-[#07363a]/55 px-3 py-2 text-xs font-bold text-[#ddfbff] sm:inline-flex">
            <Radio className="h-3.5 w-3.5" />
            Live
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1240px] gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <section className="poster-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#061512]/88 p-5 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(216, 184, 106,0.85),rgba(110, 234, 242,0.75),transparent)]" />
          <div className="max-w-[52rem]">
            <div className="section-kicker">{eyebrow}</div>
            <h1 className="mt-3 text-[2.8rem] leading-[0.88] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f5edc9] sm:text-[4.4rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-[64ch] text-sm leading-6 text-[#a8bbb2] sm:text-base">
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
