export type ShellNavigationItem = {
  href: string;
  label: string;
};

export const DESKTOP_NAVIGATION: ShellNavigationItem[] = [
  { href: "/today", label: "Heute" },
  { href: "/live", label: "Live" },
  { href: "/competitions", label: "Wettbewerbe" },
  { href: "/tables", label: "Tabellen" },
  { href: "/teams", label: "Teams" },
  { href: "/favorites", label: "Favoriten" },
];

export const isNavigationItemActive = (pathname: string, href: string) => {
  if (href === "/today") {
    return pathname === "/" || pathname === "/today";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};
