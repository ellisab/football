import Link from "next/link";
import { PrimaryNavigation } from "./primary-navigation";
import { SearchControl } from "./search-control";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__inner page-container">
        <Link
          href="/"
          className="app-brand focus-ring"
          aria-label="Spieltag Startseite"
        >
          <span className="app-brand__mark" aria-hidden="true">
            S
          </span>
          <span className="app-brand__wordmark">Spieltag</span>
        </Link>

        <PrimaryNavigation />

        <div className="app-header__actions">
          <SearchControl />
        </div>
      </div>
    </header>
  );
}
