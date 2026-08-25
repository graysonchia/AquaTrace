import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, type CorporateDisclosure } from "../api/endpoints";
import {
  InstrumentLegend,
  InstrumentTooltip,
} from "../components/ChartTheme";
import {
  CHART_GRID_STROKE,
  CHART_TICK,
} from "../components/chartStyles";
import { GaugeDivider } from "../components/GaugeDivider";
import { InstrumentLoading } from "../components/InstrumentLoading";
import { SourceTierBadge } from "../components/SourceTierBadge";

const COMPANY_COLORS: Record<string, string> = {
  Google: "#1C6E8C",
  Microsoft: "#0B3142",
  "Amazon (AWS)": "#A6D8D4",
};

export function DisclosuresPage() {
  const shouldReduceMotion = useReducedMotion();
  const disclosuresQuery = useQuery({
    queryKey: ["replenishment-progress"],
    queryFn: api.getReplenishmentProgress,
  });

  if (disclosuresQuery.isLoading) {
    return <DisclosuresLoadingState />;
  }

  if (disclosuresQuery.isError) {
    return (
      <PageMessage
        title="Corporate disclosures could not be loaded"
        message="Check that the AquaTrace API and database are running, then refresh this page."
      />
    );
  }

  const disclosures = disclosuresQuery.data ?? [];
  const chartCompanies = Array.from(
    new Set(
      disclosures
        .filter((disclosure) => disclosure.replenishment_pct !== null)
        .map((disclosure) => disclosure.company),
    ),
  );
  const years = Array.from(new Set(disclosures.map((item) => item.year))).sort(
    (left, right) => left - right,
  );
  const chartData = years.map((year) => {
    const row: Record<string, number> = { year };
    disclosures
      .filter((disclosure) => disclosure.year === year)
      .forEach((disclosure) => {
        if (disclosure.replenishment_pct !== null) {
          row[disclosure.company] = disclosure.replenishment_pct;
        }
      });
    return row;
  });

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-river">
          Company-reported evidence
        </p>
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-well">
          Corporate Water Disclosures
        </h1>
        <p className="font-serif text-ink/70">
          Publicly reported withdrawal, consumption, and replenishment figures
          from company sustainability reports.
        </p>
      </div>

      <GaugeDivider label="Replenishment Trends" />

      {disclosures.length > 0 ? (
        <>
          <section className="rounded-sm border border-well/15 bg-paper p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-well">
                  Water Replenishment Progress
                </h2>
                <p className="mt-1 font-serif text-sm text-ink/60">
                  Percentage progress reported by companies that publish this metric.
                </p>
              </div>
              <span className="shrink-0">
                <SourceTierBadge tier="corporate_disclosure" />
              </span>
            </div>

            {chartCompanies.length > 0 ? (
              <div
                aria-label="Line chart of corporate water replenishment percentages by year"
                className="h-80 font-mono"
                role="img"
              >
                <ResponsiveContainer height="100%" width="100%">
                  <LineChart
                    data={chartData}
                    margin={{ bottom: 8, left: 12, right: 18, top: 8 }}
                  >
                    <CartesianGrid
                      stroke={CHART_GRID_STROKE}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="year"
                      tick={CHART_TICK}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{
                        angle: -90,
                        fill: "#0B314299",
                        fontFamily: "IBM Plex Mono, monospace",
                        position: "insideLeft",
                        value: "Replenishment %",
                      }}
                      tick={CHART_TICK}
                    />
                    <Tooltip
                      content={
                        <InstrumentTooltip
                          formatLabel={(label) => `Year ${String(label)}`}
                          formatValue={(value) =>
                            `${Number(value).toFixed(1)}%`
                          }
                        />
                      }
                    />
                    <Legend content={<InstrumentLegend />} />
                    {chartCompanies.map((company) => (
                      <Line
                        connectNulls
                        dataKey={company}
                        dot={{ r: 4 }}
                        isAnimationActive={!shouldReduceMotion}
                        key={company}
                        stroke={COMPANY_COLORS[company] ?? "#0B314280"}
                        strokeWidth={3}
                        type="monotone"
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <PageMessage
                title="No replenishment percentages are available"
                message="The disclosures contain no values for this chart."
              />
            )}
            <p className="mt-3 font-serif text-xs leading-5 text-ink/60">
              Not all companies report replenishment percentage every year. Gaps
              reflect missing disclosures, not zero progress.
            </p>
          </section>

          <GaugeDivider label="Full Disclosure Log" />

          <DisclosureTable disclosures={disclosures} />
        </>
      ) : (
        <PageMessage
          title="No corporate disclosures are available"
          message="The API returned an empty disclosure collection."
        />
      )}
    </div>
  );
}

function DisclosureTable({
  disclosures,
}: {
  disclosures: CorporateDisclosure[];
}) {
  return (
    <section className="overflow-hidden rounded-sm border border-well/15 bg-paper">
      <div className="border-b border-well/15 px-4 py-4 sm:px-6">
        <h2 className="font-display font-bold text-well">Reported figures</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-sm">
          <thead className="bg-shallow/20 text-left font-mono text-xs uppercase tracking-wide text-well/60">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">Company</th>
              <th className="px-4 py-3 font-semibold" scope="col">Year</th>
              <th className="px-4 py-3 font-semibold" scope="col">Withdrawal (gal)</th>
              <th className="px-4 py-3 font-semibold" scope="col">Consumption (gal)</th>
              <th className="px-4 py-3 font-semibold" scope="col">Replenishment</th>
              <th className="px-4 py-3 font-semibold" scope="col">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-well/10">
            {disclosures.map((disclosure) => (
              <tr className="font-serif text-ink/70 hover:bg-shallow/10" key={`${disclosure.company}-${disclosure.year}`}>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                  {disclosure.company}
                </td>
                <td className="px-4 py-3 font-mono">{disclosure.year}</td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {formatGallons(disclosure.withdrawal_gal)}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {formatGallons(disclosure.consumption_gal)}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {disclosure.replenishment_pct === null
                    ? "—"
                    : `${disclosure.replenishment_pct.toLocaleString()}%`}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <SourceTierBadge tier={disclosure.source_tier} />
                    <a
                      className="font-mono text-xs font-medium uppercase tracking-wide text-river underline decoration-shallow underline-offset-4 hover:text-well"
                      href={disclosure.source_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Report
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DisclosuresLoadingState() {
  return <InstrumentLoading className="rounded-sm border border-well/15" />;
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-sm border border-well/15 bg-paper p-6 text-center">
      <h2 className="font-display font-bold text-well">{title}</h2>
      <p className="mt-1 font-serif text-sm text-ink/70">{message}</p>
    </div>
  );
}

function formatGallons(value: number | null) {
  return value === null ? "—" : Math.round(value).toLocaleString();
}
