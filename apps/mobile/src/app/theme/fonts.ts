import { Platform } from "react-native";

export const appFonts = {
  heading: Platform.select({
    ios: "AvenirNextCondensed-Heavy",
    android: "sans-serif-condensed",
    default: "System",
  }) as string,
  body: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "System",
  }) as string,
  bodyMedium: Platform.select({
    ios: "System",
    android: "sans-serif-medium",
    default: "System",
  }) as string,
  bodySemibold: Platform.select({
    ios: "System",
    android: "sans-serif-medium",
    default: "System",
  }) as string,
  bodyBold: Platform.select({
    ios: "System",
    android: "sans-serif-medium",
    default: "System",
  }) as string,
} as const;
