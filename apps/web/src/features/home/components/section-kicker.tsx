import type { ReactNode } from "react";

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
      {children}
    </div>
  );
}
