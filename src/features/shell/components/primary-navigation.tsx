"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESKTOP_NAVIGATION, isNavigationItemActive } from "../navigation";

export function PrimaryNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Hauptnavigation" className="shell-primary-nav">
      {DESKTOP_NAVIGATION.map((item) => {
        const isActive = isNavigationItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="shell-nav-link focus-ring"
            data-active={isActive ? "true" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
