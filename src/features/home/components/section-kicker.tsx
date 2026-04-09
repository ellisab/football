import type { ReactNode } from "react";

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#ffd66c]">
      <span className="h-2 w-2 rounded-full bg-[#ffd66c] shadow-[0_0_18px_rgba(255,214,108,0.65)]" />
      {children}
    </div>
  );
}
