"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
};

export function SearchControl() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "/" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      router.push("/search");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <Link
      href="/search"
      className="shell-search-control focus-ring"
      aria-label="Teams, Wettbewerbe und Spiele suchen"
    >
      <Search aria-hidden="true" className="shell-action-icon" />
      <span className="shell-search-control__label">Suchen</span>
      <kbd className="shell-search-control__key">/</kbd>
    </Link>
  );
}
