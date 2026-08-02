"use client";

import { cn } from "@/lib/utils";

export function PhotoPlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120"><rect width="160" height="120" rx="10" fill="#141b2b"/><g fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.6"><path d="M0 70 Q40 50 80 74 T160 66"/><path d="M0 90 Q50 78 100 92 T160 84"/><path d="M20 0 Q10 40 22 80"/><path d="M130 0 Q138 44 126 90"/></g><rect x="30" y="20" width="100" height="12" rx="6" fill="#1e293b"/><rect x="46" y="40" width="68" height="8" rx="4" fill="#1e293b"/><text x="80" y="112" text-anchor="middle" font-family="ui-monospace, monospace" font-size="8" letter-spacing="2" fill="#64748b">${label.toUpperCase()}</text></svg>`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "bg-[#141b2b] border border-white/[0.08] rounded-xl overflow-hidden",
        className,
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}
