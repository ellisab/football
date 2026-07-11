import Link from "next/link";

const footerLinks = [
  { href: "/today", label: "Heute" },
  { href: "/competitions", label: "Wettbewerbe" },
  { href: "/tables", label: "Tabellen" },
  { href: "/teams", label: "Teams" },
  { href: "/favorites", label: "Favoriten" },
  { href: "/search", label: "Suchen" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner page-container">
        <div>
          <div className="site-footer__brand">Spieltag</div>
          <p className="site-footer__description">
            Ergebnisse, Spieltage und Tabellen ohne Umwege.
          </p>
        </div>

        <nav aria-label="Fußnavigation" className="site-footer__nav">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="focus-ring">
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="site-footer__source">
          Daten von{" "}
          <a
            href="https://www.openligadb.de/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring"
          >
            OpenLigaDB
          </a>
        </p>
      </div>
    </footer>
  );
}
