import { useEffect, useMemo, useState } from "react";
import { Image, Text, View } from "react-native";
import { SvgUri } from "react-native-svg";
import { isSvgUrl, normalizeIconUrl } from "@footballleagues/core/teams";
import type { AppStyles } from "../../../app/theme/styles";
import { getTeamLogoProxyUrl } from "../data/team-logo-url";

export function TeamBadge({
  name,
  iconUrl,
  size = 26,
  styles,
}: {
  name?: string;
  iconUrl?: string;
  size?: number;
  styles: AppStyles;
}) {
  const [failed, setFailed] = useState(false);
  const normalizedUrl = useMemo(
    () =>
      normalizeIconUrl(iconUrl, {
        convertWikimediaSvgToPng: true,
      }),
    [iconUrl]
  );

  useEffect(() => {
    setFailed(false);
  }, [normalizedUrl]);

  const sizeStyle = { width: size, height: size, borderRadius: size / 2 };
  const innerSize = Math.max(12, Math.round(size * 0.7));
  const textSize = Math.max(10, Math.round(size * 0.45));
  const proxiedUrl = useMemo(() => getTeamLogoProxyUrl(iconUrl), [iconUrl]);

  if (normalizedUrl && proxiedUrl && !failed) {
    const isSvg = isSvgUrl(normalizedUrl);

    return (
      <View style={[styles.teamLogoFrame, sizeStyle]}>
        {isSvg ? (
          <SvgUri
            uri={proxiedUrl}
            width={innerSize}
            height={innerSize}
            onError={() => setFailed(true)}
          />
        ) : (
          <Image
            source={{ uri: proxiedUrl }}
            accessibilityLabel={name ?? "Vereinswappen"}
            resizeMode="contain"
            style={{ width: innerSize, height: innerSize }}
            onError={() => setFailed(true)}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.teamLogoFallback, sizeStyle]}>
      <Text style={[styles.teamLogoFallbackText, { fontSize: textSize }]}>
        {(name ?? "T").slice(0, 1)}
      </Text>
    </View>
  );
}
