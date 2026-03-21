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
        <h2 className="text-[2rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#ffffff] sm:text-[2.45rem]">
          {title}
        </h2>
        {subtitle ? <p className="text-sm text-[#9ca6ba]">{subtitle}</p> : null}
      </div>
    </div>
  );
}
