const normalizeBaseUrl = (value?: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
};

export const getWebBaseUrl = () => {
  return normalizeBaseUrl(process.env.EXPO_PUBLIC_WEB_BASE_URL);
};

export const buildWebAppUrl = (
  pathname: string,
  params?: Record<string, string | number | undefined>
) => {
  const baseUrl = getWebBaseUrl();

  if (!baseUrl) {
    return undefined;
  }

  const url = new URL(pathname, `${baseUrl}/`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
};
