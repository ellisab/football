import {
  isAllowedImageHost,
  normalizeIconUrl,
} from "@footballleagues/core/teams";
import Image from "next/image";

type TeamBadgeProps = {
  name?: string;
  iconUrl?: string;
  size?: number;
  className?: string;
  textClassName?: string;
  decorative?: boolean;
};

export function TeamBadge({
  name,
  iconUrl,
  size = 28,
  className,
  textClassName,
  decorative = false,
}: TeamBadgeProps) {
  const normalizedUrl = normalizeIconUrl(iconUrl);
  const sizeStyle = { width: size, height: size, borderRadius: size / 2 };
  const baseClassName =
    className ??
    "bg-[linear-gradient(135deg,rgba(216, 184, 106,0.26),rgba(38,126,112,0.22),rgba(110, 234, 242,0.2))] ring-1 ring-white/10";

  if (normalizedUrl && isAllowedImageHost(normalizedUrl)) {
    return (
      <Image
        src={normalizedUrl}
        alt={decorative ? "" : (name ?? "Vereinswappen")}
        width={size}
        height={size}
        className={`rounded-full object-contain ${baseClassName}`}
        style={sizeStyle}
      />
    );
  }

  return (
    <div
      {...(decorative
        ? { "aria-hidden": true }
        : { "aria-label": name ?? "Vereinswappen", role: "img" as const })}
      className={`flex items-center justify-center rounded-full text-xs font-semibold text-[var(--text)] ${baseClassName}`}
      style={sizeStyle}
    >
      <span className={textClassName}>{(name ?? "T").slice(0, 1)}</span>
    </div>
  );
}
