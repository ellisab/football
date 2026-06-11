"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

export type MobileGroupSelectorOption = {
  href: string;
  key: string;
  label: string;
  meta: number;
  metaLabel: string;
};

export function MobileGroupSelector({
  activeTitle,
  options,
  selectedKey,
}: {
  activeTitle: string;
  options: MobileGroupSelectorOption[];
  selectedKey: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details ref={detailsRef} className="group relative w-full md:hidden">
      <summary
        aria-label={`Gruppe auswählen: ${activeTitle}`}
        className="flex h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-full border border-[#dcbc6e]/50 bg-[#223d35]/88 px-4 text-sm font-semibold text-[#f4efd6] [&::-webkit-details-marker]:hidden"
      >
        <span className="truncate">{activeTitle}</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 max-h-[52svh] overflow-y-auto rounded-[1.15rem] border border-white/10 bg-[#081116] py-1 shadow-[0_18px_42px_rgba(2,9,12,0.44)]">
        {options.map((option) => {
          const isActive = selectedKey === option.key;

          return (
            <Link
              key={option.key}
              href={option.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${option.label}, ${option.meta} ${option.metaLabel}${
                isActive ? ", ausgewählt" : ""
              }`}
              onClick={closeMenu}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-[#223d35] text-[#f4efd6]"
                  : "text-[#c8d7d0] hover:bg-white/[0.07] hover:text-[#f7fbf8]"
              }`}
            >
              <span className="truncate">{option.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? "bg-[#dcbc6e]/18 text-[#fff3c2]"
                    : "bg-white/[0.06] text-[#9eb4ab]"
                }`}
              >
                {option.meta}
              </span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}
