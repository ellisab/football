"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@footballleagues/ui/button";
import type { FavoriteKind } from "./favorites-storage";
import { setFavorite, useIsFavorite } from "./favorites-store";

export type FavoriteButtonProps = {
  className?: string;
  disabled?: boolean;
  id: string;
  kind: FavoriteKind;
  label: string;
  onFavoriteChange?: (selected: boolean) => void;
  showLabel?: boolean;
};

export function FavoriteButton({
  className,
  disabled = false,
  id,
  kind,
  label,
  onFavoriteChange,
  showLabel = true,
}: FavoriteButtonProps) {
  const selected = useIsFavorite(kind, id);
  const [announcement, setAnnouncement] = useState("");
  const actionLabel = selected
    ? `${label} aus Favoriten entfernen`
    : `${label} zu Favoriten hinzufügen`;

  const handleClick = () => {
    const nextSelected = !selected;
    const persistedSelected = setFavorite(kind, id, nextSelected);

    if (persistedSelected !== nextSelected) {
      setAnnouncement("Favoriten konnten nicht gespeichert werden.");
      return;
    }

    setAnnouncement(
      nextSelected
        ? `${label} wurde zu deinen Favoriten hinzugefügt.`
        : `${label} wurde aus deinen Favoriten entfernt.`
    );
    onFavoriteChange?.(nextSelected);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={actionLabel}
        aria-pressed={selected}
        data-favorite-kind={kind}
        data-favorite-selected={selected ? "true" : "false"}
        disabled={disabled || id.trim().length === 0}
        onClick={handleClick}
        className={`min-h-11 rounded-full px-4 ${
          selected
            ? "border-[var(--action)] bg-[color-mix(in_srgb,var(--action)_12%,transparent)] text-[var(--action)]"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
        } ${className ?? ""}`}
      >
        <Star
          aria-hidden="true"
          className="h-4 w-4"
          fill={selected ? "currentColor" : "none"}
        />
        {showLabel ? (
          <span>{selected ? "Favorisiert" : "Favorit"}</span>
        ) : null}
      </Button>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </>
  );
}
