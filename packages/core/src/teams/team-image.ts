import {
  ALLOWED_IMAGE_HOSTS,
  DEFAULT_WIKIMEDIA_THUMB_SIZE,
  WIKIMEDIA_HOST,
  WIKIMEDIA_IMAGE_HEADERS,
} from "./constants";

export type NormalizeIconUrlOptions = {
  convertWikimediaSvgToPng?: boolean;
  forceHttps?: boolean;
  wikimediaThumbSize?: number;
};

const toWikimediaThumbPngPath = (pathname: string, thumbSize: number) => {
  const lowerPath = pathname.toLowerCase();
  if (
    !lowerPath.includes("/wikipedia/commons/") ||
    lowerPath.includes("/wikipedia/commons/thumb/") ||
    !lowerPath.endsWith(".svg")
  ) {
    return pathname;
  }

  const fileName = pathname.split("/").pop();
  if (!fileName) return pathname;

  const directory = pathname.slice(0, -(fileName.length + 1));
  const thumbDirectory = directory.replace(
    "/wikipedia/commons/",
    "/wikipedia/commons/thumb/"
  );

  return `${thumbDirectory}/${fileName}/${thumbSize}px-${fileName}.png`;
};

export const isAllowedImageHost = (iconUrl?: string) => {
  if (!iconUrl) return false;

  try {
    const { hostname } = new URL(iconUrl);
    return ALLOWED_IMAGE_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

export const normalizeIconUrl = (
  iconUrl?: string,
  options?: NormalizeIconUrlOptions
) => {
  if (!iconUrl) return undefined;

  const forceHttps = options?.forceHttps ?? true;
  const convertWikimediaSvgToPng = options?.convertWikimediaSvgToPng ?? false;
  const wikimediaThumbSize =
    options?.wikimediaThumbSize ?? DEFAULT_WIKIMEDIA_THUMB_SIZE;

  try {
    const url = new URL(iconUrl);

    if (forceHttps && url.protocol === "http:" && ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
      url.protocol = "https:";
    }

    if (convertWikimediaSvgToPng && url.hostname === WIKIMEDIA_HOST) {
      url.pathname = toWikimediaThumbPngPath(url.pathname, wikimediaThumbSize);
    }

    return url.toString();
  } catch {
    return iconUrl;
  }
};

export const isSvgUrl = (iconUrl?: string) => {
  if (!iconUrl) return false;

  try {
    const url = new URL(iconUrl);
    const pathname = url.pathname.toLowerCase();
    if (pathname.endsWith(".svg")) return true;

    const format = url.searchParams.get("format");
    return format?.toLowerCase() === "svg";
  } catch {
    return iconUrl.toLowerCase().includes(".svg");
  }
};

export const getImageRequestHeaders = (iconUrl?: string) => {
  if (!iconUrl) return undefined;

  try {
    const { hostname } = new URL(iconUrl);
    return hostname === WIKIMEDIA_HOST ? WIKIMEDIA_IMAGE_HEADERS : undefined;
  } catch {
    return undefined;
  }
};
