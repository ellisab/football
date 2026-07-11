export default function CompetitionsLoading() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="Wettbewerbe werden geladen">
      <div className="wide-column">
        <div className="skeleton-heading">
          <span />
          <span />
          <span />
        </div>
        <div className="skeleton-control" />
        <div className="skeleton-card-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="skeleton-card" key={index} />
          ))}
        </div>
        <p className="sr-only">Wettbewerbe und Spieltage werden geladen.</p>
      </div>
    </div>
  );
}
