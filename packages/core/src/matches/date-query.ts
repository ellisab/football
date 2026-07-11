const BERLIN_DATE_QUERY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const createCalendarDate = (year: number, month: number, day: number) => {
  const date = new Date(0);
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
};

const formatCalendarDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${String(year).padStart(4, "0")}-${month}-${day}`;
};

export const parseBerlinDateQuery = (
  value: string | string[] | null | undefined
): string | undefined => {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();
  const match = BERLIN_DATE_QUERY_PATTERN.exec(normalized);
  if (!match) return undefined;

  const year = Number.parseInt(match[1] as string, 10);
  const month = Number.parseInt(match[2] as string, 10);
  const day = Number.parseInt(match[3] as string, 10);
  const date = createCalendarDate(year, month, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return normalized;
};

export const shiftBerlinDateQuery = (
  value: string,
  days: number
): string | undefined => {
  const normalized = parseBerlinDateQuery(value);
  if (!normalized || !Number.isInteger(days)) return undefined;

  const [year, month, day] = normalized.split("-").map(Number);
  const date = createCalendarDate(year as number, month as number, day as number);
  date.setUTCDate(date.getUTCDate() + days);

  const shifted = formatCalendarDate(date);
  return parseBerlinDateQuery(shifted);
};
