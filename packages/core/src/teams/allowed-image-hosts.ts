export const ALLOWED_IMAGE_HOSTS = [
  "upload.wikimedia.org",
  "i.imgur.com",
  "www.bundesliga-reisefuehrer.de",
  "bundesliga-reisefuehrer.de",
  "www.bundesliga-logos.com",
  "bundesliga-logos.com",
  "www.bundesliga.com",
  "bundesliga.com",
  "www.bundesliga.de",
  "bundesliga.de",
] as const;

export const ALLOWED_IMAGE_HOST_SET = new Set<string>(ALLOWED_IMAGE_HOSTS);

export const ALLOWED_IMAGE_REMOTE_PATTERNS = ALLOWED_IMAGE_HOSTS.map(
  (hostname) => ({
    protocol: "https" as const,
    hostname,
  }),
);
