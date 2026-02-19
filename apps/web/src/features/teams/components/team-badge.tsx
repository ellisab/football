import Image from "next/image";
import { isAllowedImageHost, normalizeIconUrl } from "@footballleagues/core";

type TeamBadgeProps = {
  name?: string;
  iconUrl?: string;
};

export function TeamBadge({ name, iconUrl }: TeamBadgeProps) {
  const normalizedUrl = normalizeIconUrl(iconUrl);

  if (normalizedUrl && isAllowedImageHost(normalizedUrl)) {
    return (
      <Image
        src={normalizedUrl}
        alt={name ?? "Team crest"}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full bg-[#f1f2f6] object-contain"
      />
    );
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f2f6] text-xs font-semibold text-[#575b66]">
      {(name ?? "T").slice(0, 1)}
    </div>
  );
}
