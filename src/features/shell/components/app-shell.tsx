import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { MatchdayClickEffect } from "./matchday-signal-field";
import { MobileNavigation } from "./mobile-navigation";
import { SiteFooter } from "./site-footer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell" data-app-shell>
      <a href="#main-content" className="skip-link">
        Zum Inhalt springen
      </a>
      <MatchdayClickEffect />
      <AppHeader />
      <main id="main-content" tabIndex={-1} className="app-shell__content">
        {children}
      </main>
      <SiteFooter />
      <MobileNavigation />
    </div>
  );
}
