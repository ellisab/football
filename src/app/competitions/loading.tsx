const COMPETITION_SKELETON_KEYS = [
  "competition-skeleton-1",
  "competition-skeleton-2",
  "competition-skeleton-3",
  "competition-skeleton-4",
  "competition-skeleton-5",
  "competition-skeleton-6",
] as const;

export default function CompetitionsLoading() {
  return (
    <section
      className="page-shell"
      aria-busy="true"
      aria-label="Wettbewerbe werden geladen"
    >
      <div className="wide-column">
        <div className="skeleton-heading">
          <span />
          <span />
          <span />
        </div>
        <div className="skeleton-control" />
        <div className="skeleton-card-grid" aria-hidden="true">
          {COMPETITION_SKELETON_KEYS.map((key) => (
            <div className="skeleton-card" key={key} />
          ))}
        </div>
        <p className="sr-only">Wettbewerbe und Spieltage werden geladen.</p>
      </div>
    </section>
  );
}
