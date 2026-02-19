import Image from "next/image";
import { isAllowedImageHost, normalizeIconUrl } from "@footballleagues/core";

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
  const baseClassName = className ?? "bg-[#f1f2f6]";

  if (normalizedUrl && isAllowedImageHost(normalizedUrl)) {
    return (
      <Image
        src={normalizedUrl}
        alt={name ?? "Team crest"}
        width={size}
        height={size}
        className={`rounded-full object-contain ${baseClassName}`}
        style={sizeStyle}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-xs font-semibold text-[#575b66] ${baseClassName}`}
      style={sizeStyle}
    >
      <span className={textClassName}>{(name ?? "T").slice(0, 1)}</span>
    </div>
  );
}
