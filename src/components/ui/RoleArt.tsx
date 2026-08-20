// Small, flat, theme-matched SVG illustrations (currentColor driven, so they
// inherit each role's accent via the parent's text-{tone} class).

export function CustomerArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className}>
      <rect x="10" y="22" width="34" height="14" rx="4" fill="currentColor" fillOpacity="0.18" />
      <path
        d="M14 22l3.5-8a4 4 0 0 1 3.7-2.5h13.6a4 4 0 0 1 3.7 2.5l3.5 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="8" y="22" width="38" height="13" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="35" r="3" fill="currentColor" />
      <circle cx="38" cy="35" r="3" fill="currentColor" />
      <rect x="44" y="8" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="47" y="11" width="3" height="3" fill="currentColor" />
      <rect x="52" y="11" width="3" height="3" fill="currentColor" />
      <rect x="47" y="16" width="3" height="3" fill="currentColor" />
      <rect x="52" y="16" width="3" height="3" fill="currentColor" />
    </svg>
  );
}

export function EmployeeArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className}>
      <rect x="6" y="14" width="6" height="26" rx="1.5" fill="currentColor" fillOpacity="0.25" />
      <rect x="52" y="14" width="6" height="26" rx="1.5" fill="currentColor" fillOpacity="0.25" />
      <rect
        x="11"
        y="18"
        width="42"
        height="5"
        rx="2.5"
        fill="currentColor"
        transform="rotate(-18 32 20)"
      />
      <circle cx="12" cy="30" r="2" fill="currentColor" />
      <circle cx="52" cy="30" r="2" fill="currentColor" />
      <path d="M20 40h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 44h4M36 44h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SecurityArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className}>
      <path
        d="M32 6l16 5v11c0 10-6.8 17.5-16 20-9.2-2.5-16-10-16-20V11l16-5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M25 22l5 5 9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="22" r="19" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.4" strokeDasharray="2 4" />
    </svg>
  );
}

export function OwnerArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className}>
      <path d="M8 40h48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="14" y="26" width="7" height="14" rx="1.5" fill="currentColor" fillOpacity="0.3" />
      <rect x="26" y="18" width="7" height="22" rx="1.5" fill="currentColor" fillOpacity="0.55" />
      <rect x="38" y="10" width="7" height="30" rx="1.5" fill="currentColor" />
      <path d="M14 20l10-7 8 4 14-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 7h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className}>
      <circle cx="32" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="34" r="4" fill="currentColor" />
      <circle cx="50" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M32 14v8M32 22l-15 8M32 22l15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Small connecting-flow illustration used on the customer booking hero.
export function TicketArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 56" fill="none" className={className}>
      <rect x="6" y="10" width="60" height="36" rx="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.06" />
      <path d="M44 10v36" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" />
      <rect x="14" y="18" width="22" height="4" rx="2" fill="currentColor" fillOpacity="0.5" />
      <rect x="14" y="26" width="16" height="4" rx="2" fill="currentColor" fillOpacity="0.3" />
      <rect x="51" y="18" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="54" y="21" width="2" height="2" fill="currentColor" />
      <rect x="59" y="21" width="2" height="2" fill="currentColor" />
      <rect x="54" y="26" width="2" height="2" fill="currentColor" />
      <rect x="59" y="26" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
