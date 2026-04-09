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
      <div className="grid gap-1">
        <h2 className="max-w-[14ch] text-[2rem] leading-[0.9] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#fff6fd] sm:text-[2.55rem]">
          {title}
        </h2>
        {subtitle ? <p className="max-w-[62ch] text-sm leading-6 text-[#dcb5cb]">{subtitle}</p> : null}
      </div>
    </div>
  );
}
