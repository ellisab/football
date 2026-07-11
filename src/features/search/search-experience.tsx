"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { type FormEvent, useId, useMemo, useRef, useState } from "react";
import {
  rankSearchResults,
  type SearchResultItem,
  type SearchResultKind,
} from "./search-ranking";

const KIND_LABELS: Record<SearchResultKind, string> = {
  competition: "Wettbewerb",
  match: "Spiel",
  matchday: "Spieltag",
  team: "Team",
};

export type SearchExperienceProps = {
  autoFocus?: boolean;
  className?: string;
  emptyMessage?: string;
  initialQuery?: string;
  items: readonly SearchResultItem[];
  label?: string;
  noResultsMessage?: string;
  onResultSelect?: (item: SearchResultItem) => void;
  placeholder?: string;
  resultLimit?: number;
};

export function SearchExperience({
  autoFocus = false,
  className,
  emptyMessage = "Suche nach Teams, Wettbewerben, Spieltagen oder Spielen.",
  initialQuery = "",
  items,
  label = "Fußball durchsuchen",
  noResultsMessage = "Keine passenden Ergebnisse gefunden.",
  onResultSelect,
  placeholder = "Team, Wettbewerb oder Spieltag",
  resultLimit = 12,
}: SearchExperienceProps) {
  const router = useRouter();
  const inputId = useId();
  const resultsId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(
    () => rankSearchResults(items, query, { limit: resultLimit }),
    [items, query, resultLimit]
  );
  const groupedResults = useMemo(() => {
    const groups = new Map<SearchResultKind, typeof results>();
    for (const result of results) {
      const existing = groups.get(result.item.kind) ?? [];
      groups.set(result.item.kind, [...existing, result]);
    }
    return [...groups.entries()];
  }, [results]);
  const hasQuery = query.trim().length > 0;

  const selectResult = (item: SearchResultItem) => {
    onResultSelect?.(item);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
  };

  const clearQuery = () => {
    setQuery("");
    router.replace("/search");
    inputRef.current?.focus();
  };

  return (
    <section
      role="search"
      aria-labelledby={`${inputId}-label`}
      className={`grid gap-4 ${className ?? ""}`}
    >
      <form action="/search" method="get" onSubmit={handleSubmit} className="grid gap-2">
        <label
          id={`${inputId}-label`}
          htmlFor={inputId}
          className="text-sm font-semibold text-current"
        >
          {label}
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-current opacity-60"
          />
          <input
            ref={inputRef}
            id={inputId}
            name="q"
            type="search"
            inputMode="search"
            autoComplete="off"
            autoFocus={autoFocus}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            aria-controls={resultsId}
            aria-describedby={statusId}
            className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] py-3 pr-32 pl-12 text-base text-[var(--text)] outline-none transition focus-visible:border-[var(--focus)] focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--focus)_16%,transparent)]"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Suchanfrage löschen"
              className="absolute top-1/2 right-[5.4rem] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
          <button type="submit" className="button-primary absolute top-1/2 right-1.5 min-h-11 -translate-y-1/2 px-3">
            Suchen
          </button>
        </div>
      </form>

      <p id={statusId} role="status" aria-live="polite" aria-atomic="true" className="text-sm opacity-70">
        {hasQuery
          ? results.length === 1
            ? "1 Ergebnis"
            : `${results.length} Ergebnisse`
          : emptyMessage}
      </p>

      <div id={resultsId} aria-label="Suchergebnisse" className="grid gap-5">
        {hasQuery && results.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-muted)]">
            {noResultsMessage}
          </p>
        ) : (
          groupedResults.map(([kind, kindResults]) => (
            <section key={kind} aria-labelledby={`${resultsId}-${kind}`}>
              <h2 id={`${resultsId}-${kind}`} className="eyebrow mb-2">
                {KIND_LABELS[kind]}
              </h2>
              <ul className="grid gap-2">
                {kindResults.map(({ item }) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      href={item.href}
                      onClick={() => selectResult(item)}
                      className="group flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--focus)_20%,transparent)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{item.label}</span>
                        {item.description ? (
                          <span className="mt-0.5 block truncate text-sm opacity-65">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
                        {KIND_LABELS[item.kind]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </section>
  );
}
