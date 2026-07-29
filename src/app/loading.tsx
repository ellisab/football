const MATCH_SKELETON_KEYS = [
  "match-skeleton-1",
  "match-skeleton-2",
  "match-skeleton-3",
  "match-skeleton-4",
  "match-skeleton-5",
] as const;

export default function AppLoading() {
  return (
    <section
      className="page-shell"
      aria-busy="true"
      aria-label="Inhalte werden geladen"
    >
      <div className="content-column">
        <div className="skeleton-heading">
          <span />
          <span />
          <span />
        </div>
        <div className="skeleton-control" />
        <div className="grid gap-3" aria-hidden="true">
          {MATCH_SKELETON_KEYS.map((key) => (
            <div className="skeleton-match" key={key} />
          ))}
        </div>
        <p className="sr-only">Fußballdaten werden geladen.</p>
      </div>
    </section>
  );
}
