import { SectionKicker } from "./section-kicker";

export function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="grid gap-3">
      <SectionKicker>{kicker}</SectionKicker>
      <div className="grid gap-2">
        <h2 className="max-w-[15ch] text-[2rem] leading-[0.9] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] sm:text-[2.65rem]">
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-[62ch] text-sm leading-6 text-[#a9c0b6]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
