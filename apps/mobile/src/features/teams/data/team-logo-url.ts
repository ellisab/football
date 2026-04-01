import { isAllowedImageHost, normalizeIconUrl } from "@footballleagues/core/teams";
import { buildWebAppUrl } from "../../../app/config/web-base-url";

export const getTeamLogoProxyUrl = (iconUrl?: string) => {
  const normalizedUrl = normalizeIconUrl(iconUrl, {
    convertWikimediaSvgToPng: true,
  });

  if (!normalizedUrl || !isAllowedImageHost(normalizedUrl)) {
    return undefined;
  }

  return buildWebAppUrl("/api/team-logo", {
    url: normalizedUrl,
  });
};
