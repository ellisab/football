import {
  getBerlinDateKey,
  parseBerlinDateQuery,
  shiftBerlinDateQuery,
} from "@footballleagues/core/matches";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const longDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Berlin",
  weekday: "long",
  year: "numeric",
});

const toDisplayDate = (dateKey: string) => new Date(`${dateKey}T12:00:00.000Z`);

const dayFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  timeZone: "Europe/Berlin",
  weekday: "short",
});

const compactDateLabel = (dateKey: string) =>
  dayFormatter.format(toDisplayDate(dateKey)).replace(".", "");

export const resolveDateQuery = (value?: string) => {
  return parseBerlinDateQuery(value) ?? getBerlinDateKey(new Date()) ?? "";
};

export function DateNavigator({ dateKey }: { dateKey: string }) {
  const previous = shiftBerlinDateQuery(dateKey, -1) ?? dateKey;
  const next = shiftBerlinDateQuery(dateKey, 1) ?? dateKey;
  const today = getBerlinDateKey(new Date()) ?? dateKey;
  const isToday = dateKey === today;

  return (
    <div className="date-controls">
      <nav className="date-navigator" aria-label="Datum auswählen">
        <Link
          href={`/today?date=${previous}`}
          className="icon-button"
          aria-label="Vorheriger Tag"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </Link>
        <div className="date-navigator__days">
          <Link
            href={`/today?date=${previous}`}
            className="date-navigator__day"
          >
            {compactDateLabel(previous)}
          </Link>
          <span
            className="date-navigator__day"
            data-active="true"
            aria-current="date"
          >
            <span>{isToday ? "Heute" : compactDateLabel(dateKey)}</span>
            <small>{longDateFormatter.format(toDisplayDate(dateKey))}</small>
          </span>
          <Link href={`/today?date=${next}`} className="date-navigator__day">
            {compactDateLabel(next)}
          </Link>
        </div>
        {!isToday ? (
          <Link href={`/today?date=${today}`} className="date-today-link">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Heute
          </Link>
        ) : null}
        <Link
          href={`/today?date=${next}`}
          className="icon-button"
          aria-label="Nächster Tag"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </Link>
      </nav>
      <form action="/today" method="get" className="date-picker-form">
        <label htmlFor="date" className="control-label">
          Datum direkt wählen
        </label>
        <input id="date" name="date" type="date" defaultValue={dateKey} />
        <button type="submit" className="button-secondary">
          Anzeigen
        </button>
      </form>
    </div>
  );
}
