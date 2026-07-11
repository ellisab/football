type BrandElementProps = {
  className?: string;
};

export function BrandMark({ className }: BrandElementProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 28V20C16 13.373 21.373 8 28 8H44"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="12"
      />
      <circle cx="32" cy="32" fill="currentColor" r="5.5" />
      <path
        d="M48 36V44C48 50.627 42.627 56 36 56H20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="12"
      />
    </svg>
  );
}

export function BrandWordmark({ className }: BrandElementProps) {
  return (
    <span className={className}>
      spieltag<span className="brand-wordmark__dot">.</span>day
    </span>
  );
}
