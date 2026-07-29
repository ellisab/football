const DEFAULT_SITE_URL = "http://localhost:3000";

const normalizeSiteUrl = (value?: string) => {
  try {
    return new URL(value ?? DEFAULT_SITE_URL).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
};

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL,
);
