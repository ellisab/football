export function ErrorBanner({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#2d553f] bg-[#13241d] px-4 py-3 text-sm text-[#9ad8b6]">
      Einige Daten konnten nicht geladen werden: {errors.join(", ")}. Bitte
      aktualisieren.
    </div>
  );
}
