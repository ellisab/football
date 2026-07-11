export default function AppLoading() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="Inhalte werden geladen">
      <div className="content-column">
        <div className="skeleton-heading">
          <span />
          <span />
          <span />
        </div>
        <div className="skeleton-control" />
        <div className="grid gap-3" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="skeleton-match" key={index} />
          ))}
        </div>
        <p className="sr-only">Fußballdaten werden geladen.</p>
      </div>
    </div>
  );
}
