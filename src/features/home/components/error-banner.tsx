export function ErrorBanner({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-[1.45rem] border border-[#efaa57]/25 bg-[linear-gradient(135deg,rgba(58,32,13,0.82),rgba(24,23,18,0.88),rgba(10,22,24,0.9))] px-4 py-3 text-sm text-[#f6dfc4] shadow-[0_18px_36px_rgba(4,12,16,0.22)]">
      Einige Daten konnten nicht geladen werden: {errors.join(", ")}. Bitte
      aktualisieren.
    </div>
  );
}
