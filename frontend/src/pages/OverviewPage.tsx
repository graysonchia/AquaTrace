import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api } from "../api/endpoints";
import { GaugeDivider } from "../components/GaugeDivider";
import { InstrumentLoading } from "../components/InstrumentLoading";
import { RevealCard } from "../components/RevealCard";
import { SourceTierBadge } from "../components/SourceTierBadge";
import { SpreadGauge } from "../components/SpreadGauge";

export function OverviewPage() {
  const stationsQuery = useQuery({
    queryKey: ["stations-summary"],
    queryFn: api.getStationsSummary,
  });
  const disclosuresQuery = useQuery({
    queryKey: ["disclosures"],
    queryFn: () => api.getDisclosures(),
  });
  const comparisonQuery = useQuery({
    queryKey: ["overview-estimator-comparison", 1_000_000],
    queryFn: () => api.compareEstimator(1_000_000, "per month"),
  });

  if (
    stationsQuery.isLoading ||
    disclosuresQuery.isLoading ||
    comparisonQuery.isLoading
  ) {
    return <OverviewLoadingState />;
  }

  if (
    stationsQuery.isError ||
    disclosuresQuery.isError ||
    comparisonQuery.isError
  ) {
    return (
      <PageMessage
        title="The overview could not be loaded"
        message="Check that the AquaTrace API and database are running, then refresh this page."
      />
    );
  }

  const stations = stationsQuery.data ?? [];
  const disclosures = disclosuresQuery.data ?? [];
  const comparison = comparisonQuery.data;
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
      <section className="relative overflow-hidden rounded-sm border border-well/15 bg-paper p-6 sm:p-8">
        <TopographicPattern />
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-12">
          <div className="max-w-3xl">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-river">
              Evidence-aware reporting
            </p>
            <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-well sm:text-4xl">
              AI Water Footprint Explorer
            </h1>
            <p className="max-w-xl font-serif text-ink/70">
              Every figure below is tagged by source quality. Hover a badge to
              see what kind of evidence backs each number.
            </p>

            <p className="mt-6 max-w-xl font-serif text-sm leading-6 text-ink/70">
              Published methodologies can produce dramatically different answers
              for the same workload. The gauge measures the spread between the
              lowest and highest estimates for
              <span className="font-mono text-ink"> 1,000,000 </span>
              AI queries per month.
            </p>
          </div>

          {comparison && <SpreadGauge value={comparison.spread_ratio} />}
        </div>
      </section>

      <GaugeDivider label="Reported Baselines" />

      <section
        aria-label="Water footprint headline statistics"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <StatCard
          index={0}
          label={`Avg. Onsite WUE (${coverageLabel})`}
          value={formatAverage(avgOnsite)}
          unit="L/kWh"
          tier="peer_reviewed"
        />
        <StatCard
          index={1}
          label={`Avg. Offsite WUE (${coverageLabel})`}
          value={formatAverage(avgOffsite)}
          unit="L/kWh"
          tier="peer_reviewed"
        />
        {latestGoogle ? (
          <StatCard
            index={2}
            label={`Google Water Withdrawal (${latestGoogle.year})`}
            value={(latestGoogle.withdrawal_gal! / 1_000_000_000).toFixed(2)}
            unit="B gallons"
            tier="corporate_disclosure"
          />
        ) : (
          <StatCard
            index={2}
            label="Google Water Withdrawal"
            value="—"
            unit="No disclosure available"
            tier="corporate_disclosure"
          />
        )}
      </section>

      <GaugeDivider label="Reading the Evidence" />

      <section className="rounded-sm border border-well/15 bg-paper p-6">
        <h2 className="mb-2 font-display text-lg font-bold text-well">
          Why the numbers disagree
        </h2>
        <p className="max-w-4xl font-serif text-sm leading-6 text-ink/70">
          Published estimates of AI&apos;s water footprint span three orders of
          magnitude because sources measure different scopes—from on-site
          cooling only to the full lifecycle, including electricity generation. See
          the{" "}
          <Link
            className="font-medium text-river underline decoration-shallow underline-offset-4 hover:text-well"
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
  index,
  value,
  unit,
  tier,
}: {
  label: string;
  index: number;
  value: string;
  unit: string;
  tier: string;
}) {
  return (
    <RevealCard
      className="rounded-sm border border-well/15 bg-paper p-5"
      index={index}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="font-mono text-sm leading-5 text-ink/60">{label}</span>
        <span className="shrink-0">
          <SourceTierBadge tier={tier} />
        </span>
      </div>
      <div className="font-mono text-3xl font-bold tracking-tight text-well">
        {value}{" "}
        <span className="font-serif text-sm font-normal tracking-normal text-ink/60">
          {unit}
        </span>
      </div>
    </RevealCard>
  );
}

function OverviewLoadingState() {
  return <InstrumentLoading className="rounded-sm border border-well/15" />;
}

function TopographicPattern() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-well opacity-[0.035]"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          height="120"
          id="topographic-contours"
          patternUnits="userSpaceOnUse"
          width="240"
        >
          <path
            d="M-20 18 C28 -4 68 43 116 19 S205 -1 260 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M-20 43 C24 17 70 65 123 41 S211 24 260 49"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M-20 76 C32 49 72 99 132 70 S216 57 260 82"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M-20 106 C35 80 85 127 142 99 S220 89 260 111"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect fill="url(#topographic-contours)" height="100%" width="100%" />
    </svg>
  );
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-sm border border-drought/30 bg-drought/5 p-6">
      <h1 className="font-display font-bold text-drought">{title}</h1>
      <p className="mt-1 font-serif text-sm text-ink/70">{message}</p>
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
