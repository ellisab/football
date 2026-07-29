"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useFavorites } from "./favorites-store";

export type FavoriteSpotlightItem = {
  href: string;
  id: string;
  kind: "competition" | "team";
  label: string;
};

export function FavoriteSpotlight({
  items,
}: {
  items: FavoriteSpotlightItem[];
}) {
  const favorites = useFavorites();
  const selected = items.filter((item) =>
    item.kind === "competition"
      ? favorites.competitionIds.includes(item.id)
      : favorites.teamIds.includes(item.id),
  );

  if (selected.length === 0) return null;

  return (
    <section
      className="favorite-spotlight"
      aria-labelledby="favorite-spotlight-title"
    >
      <div>
        <Star aria-hidden="true" className="h-4 w-4" />
        <h2 id="favorite-spotlight-title">Deine Favoriten</h2>
      </div>
      <div className="favorite-spotlight-links">
        {selected.slice(0, 6).map((item) => (
          <Link key={`${item.kind}-${item.id}`} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/favorites">Alle</Link>
      </div>
    </section>
  );
}
