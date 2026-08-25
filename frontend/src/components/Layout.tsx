import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Overview" },
  { path: "/map", label: "Facilities Map" },
  { path: "/energy-mix", label: "Energy Mix" },
  { path: "/disclosures", label: "Corporate Disclosures" },
  { path: "/estimator", label: "Estimator" },
  { path: "/forecast", label: "Forecast" },
  { path: "/case-studies", label: "Case Studies" },
  { path: "/calculator", label: "Personal Calculator" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 left-0 z-30 hidden w-6 border-r border-well/5 py-3 lg:flex lg:flex-col lg:justify-between"
      >
        {Array.from({ length: 41 }).map((_, index) => (
          <span
            className={`block h-px bg-well/10 ${index % 5 === 0 ? "w-4" : "w-2.5"}`}
            key={index}
          />
        ))}
      </div>
      <nav
        aria-label="Primary navigation"
        className="bg-paper border-b border-well/15 px-6 py-4"
      >
        <div className="flex flex-wrap items-center gap-6 max-w-6xl mx-auto">
          <span className="font-display font-bold text-lg text-well tracking-tight">
            AquaTrace
          </span>
          {NAV_ITEMS.map((item) => (
            <Link
              aria-current={location.pathname === item.path ? "page" : undefined}
              className={`font-mono text-xs uppercase tracking-wide ${
                location.pathname === item.path
                  ? "text-river font-medium"
                  : "text-well/50"
              }`}
              key={item.path}
              to={item.path}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
