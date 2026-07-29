"use client";

import { CalendarDays, Radio, Shield, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavigationItemActive } from "../navigation";

const mobileItems = [
  { href: "/today", icon: CalendarDays, label: "Heute" },
  { href: "/live", icon: Radio, label: "Live" },
  { href: "/competitions", icon: Shield, label: "Wettbewerbe" },
  { href: "/favorites", icon: Star, label: "Favoriten" },
] as const;

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile Hauptnavigation" className="shell-mobile-nav">
      <div className="shell-mobile-nav__inner">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavigationItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="shell-mobile-nav__item focus-ring"
              data-active={isActive ? "true" : undefined}
            >
              <Icon aria-hidden="true" className="shell-mobile-nav__icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
