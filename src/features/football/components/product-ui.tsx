import { ArrowRight, CircleAlert, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageIntro({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="page-intro">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function SectionHeading({
  action,
  count,
  description,
  title,
}: {
  action?: ReactNode;
  count?: number;
  description?: string;
  title: string;
}) {
  return (
    <div className="section-heading-row">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="section-title">{title}</h2>
          {typeof count === "number" ? (
            <span className="count-badge">
              <span aria-hidden="true">{count}</span>
              <span className="sr-only">{count} Einträge</span>
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="section-description">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function DataNotice({ children }: { children: ReactNode }) {
  return (
    <aside className="data-notice" aria-label="Hinweis zur Datenabdeckung">
      <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
      <p>{children}</p>
    </aside>
  );
}

export function EmptyState({
  actionHref = "/competitions",
  actionLabel = "Wettbewerbe ansehen",
  description,
  icon = <Search aria-hidden="true" className="h-5 w-5" />,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <section className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div>
        <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
          {description}
        </p>
      </div>
      <Link href={actionHref} className="button-secondary">
        {actionLabel}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}

export function PartialDataNotice({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="data-notice" role="status">
      <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
      <p>
        Einige Daten konnten nicht aktualisiert werden: {errors.join(", ")}.
        Bereits verfügbare Informationen bleiben sichtbar.
      </p>
    </div>
  );
}
