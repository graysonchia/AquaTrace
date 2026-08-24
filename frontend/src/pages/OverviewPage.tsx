import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api } from "../api/endpoints";
import { SourceTierBadge } from "../components/SourceTierBadge";

export function OverviewPage() {
  const stationsQuery = useQuery({
    queryKey: ["stations-summary"],
    queryFn: api.getStationsSummary,
  });
  const disclosuresQuery = useQuery({
    queryKey: ["disclosures"],
    queryFn: () => api.getDisclosures(),
  });

  if (stationsQuery.isLoading || disclosuresQuery.isLoading) {
    return <OverviewLoadingState />;
  }

  if (stationsQuery.isError || disclosuresQuery.isError) {
    return (
      <PageMessage
        title="The overview could not be loaded"
        message="Check that the AquaTrace API and database are running, then refresh this page."
      />
    );
  }

  const stations = stationsQuery.data ?? [];
  const disclosures = disclosuresQuery.data ?? [];
  const avgOnsite = average(stations.map((station) => station.avg_onsite_wue));
  const avgOffsite = average(stations.map((station) => station.avg_offsite_wue));
  const latestGoogle = [...disclosures]
    .filter(
      (disclosure) =>
        disclosure.company === "Google" && disclosure.withdrawal_gal !== null,
    )
    .sort((left, right) => right.year - left.year)[0];
  const coverageLabel = stations.length > 0 ? `${stations.length} US cities` : "US cities";

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Evidence-aware reporting
        </p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">
          AI Water Footprint Explorer
        </h1>
        <p className="text-slate-600">
          Every figure below is tagged by source quality. Hover a badge to see
          what kind of evidence backs each number.
        </p>
      </div>

      <section
        aria-label="Water footprint headline statistics"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <StatCard
          label={`Avg. Onsite WUE (${coverageLabel})`}
          value={formatAverage(avgOnsite)}
          unit="L/kWh"
          tier="peer_reviewed"
        />
        <StatCard
          label={`Avg. Offsite WUE (${coverageLabel})`}
          value={formatAverage(avgOffsite)}
          unit="L/kWh"
          tier="peer_reviewed"
        />
        {latestGoogle ? (
          <StatCard
            label={`Google Water Withdrawal (${latestGoogle.year})`}
            value={(latestGoogle.withdrawal_gal! / 1_000_000_000).toFixed(2)}
            unit="B gallons"
            tier="corporate_disclosure"
          />
        ) : (
          <StatCard
            label="Google Water Withdrawal"
            value="—"
            unit="No disclosure available"
            tier="corporate_disclosure"
          />
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Why the numbers disagree</h2>
        <p className="max-w-4xl text-sm leading-6 text-slate-600">
          Published estimates of AI&apos;s water footprint span three orders of
          magnitude because sources measure different scopes—from on-site
          cooling only to the full lifecycle, including electricity generation. See
          the{" "}
          <Link
            className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-700"
            to="/estimator"
          >
            Estimator
          </Link>{" "}
          to compare them side by side.
        </p>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  tier,
}: {
  label: string;
  value: string;
  unit: string;
  tier: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="text-sm leading-5 text-slate-500">{label}</span>
        <span className="shrink-0">
          <SourceTierBadge tier={tier} />
        </span>
      </div>
      <div className="text-3xl font-bold tracking-tight text-slate-950">
        {value}{" "}
        <span className="text-sm font-normal tracking-normal text-slate-500">
          {unit}
        </span>
      </div>
    </article>
  );
}

function OverviewLoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading overview" className="space-y-8">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div
            className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white"
            key={card}
          />
        ))}
      </div>
    </div>
  );
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h1 className="font-semibold text-red-900">{title}</h1>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatAverage(value: number | null) {
  return value === null ? "—" : value.toFixed(2);
}
