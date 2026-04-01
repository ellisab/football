import Image from "next/image";
import { isAllowedImageHost, normalizeIconUrl } from "@footballleagues/core/teams";

type TeamBadgeProps = {
  name?: string;
  iconUrl?: string;
  size?: number;
  className?: string;
  textClassName?: string;
};

export function TeamBadge({
  name,
  iconUrl,
  size = 28,
  className,
  textClassName,
}: TeamBadgeProps) {
  const normalizedUrl = normalizeIconUrl(iconUrl);
  const sizeStyle = { width: size, height: size, borderRadius: size / 2 };
  const baseClassName =
    className ??
    "bg-[linear-gradient(135deg,rgba(255,153,83,0.28),rgba(255,92,154,0.22),rgba(87,235,255,0.18))] ring-1 ring-white/10";

  if (normalizedUrl && isAllowedImageHost(normalizedUrl)) {
    return (
      <Image
        src={normalizedUrl}
        alt={name ?? "Vereinswappen"}
        width={size}
        height={size}
        className={`rounded-full object-contain ${baseClassName}`}
        style={sizeStyle}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-xs font-semibold text-[#fff2fb] ${baseClassName}`}
      style={sizeStyle}
    >
      <span className={textClassName}>{(name ?? "T").slice(0, 1)}</span>
    </div>
  );
}
