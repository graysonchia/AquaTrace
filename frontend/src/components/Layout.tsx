import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Overview" },
  { path: "/map", label: "Facilities Map" },
  { path: "/disclosures", label: "Corporate Disclosures" },
  { path: "/estimator", label: "Estimator" },
  { path: "/forecast", label: "Forecast" },
  { path: "/case-studies", label: "Case Studies" },
  { path: "/calculator", label: "Personal Calculator" },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4"
        >
          <Link className="mr-2 text-lg font-bold tracking-tight" to="/">
            AquaTrace
          </Link>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`text-sm transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? "font-medium text-blue-600"
                    : "text-slate-600"
                }`}
                key={item.path}
                to={item.path}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
