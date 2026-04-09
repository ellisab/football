export function ErrorBanner({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="poster-surface rounded-[1.45rem] border-[#ff9953]/35 bg-[linear-gradient(135deg,rgba(92,27,16,0.62),rgba(87,21,48,0.58),rgba(31,14,49,0.72))] px-4 py-3 text-sm text-[#ffe1cf]">
      Einige Daten konnten nicht geladen werden: {errors.join(", ")}. Bitte
      aktualisieren.
    </div>
  );
}
