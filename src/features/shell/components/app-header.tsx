import Link from "next/link";
import { BrandMark, BrandWordmark } from "./brand";
import { PrimaryNavigation } from "./primary-navigation";
import { SearchControl } from "./search-control";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__inner page-container">
        <Link
          href="/"
          className="app-brand focus-ring"
          aria-label="spieltag.day Startseite"
        >
          <BrandMark className="app-brand__mark" />
          <BrandWordmark className="app-brand__wordmark" />
        </Link>

        <PrimaryNavigation />

        <div className="app-header__actions">
          <SearchControl />
        </div>
      </div>
    </header>
  );
}
