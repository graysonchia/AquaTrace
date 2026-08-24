import { useQuery } from "@tanstack/react-query";
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
import { SourceTierBadge } from "../components/SourceTierBadge";

const COMPANY_COLORS: Record<string, string> = {
  Google: "#4285F4",
  Microsoft: "#00A4EF",
  "Amazon (AWS)": "#FF9900",
};

export function DisclosuresPage() {
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
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Company-reported evidence
        </p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">
          Corporate Water Disclosures
        </h1>
        <p className="text-slate-600">
          Publicly reported withdrawal, consumption, and replenishment figures
          from company sustainability reports.
        </p>
      </div>

      {disclosures.length > 0 ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Water Replenishment Progress</h2>
                <p className="mt-1 text-sm text-slate-500">
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
                className="h-80"
                role="img"
              >
                <ResponsiveContainer height="100%" width="100%">
                  <LineChart
                    data={chartData}
                    margin={{ bottom: 8, left: 12, right: 18, top: 8 }}
                  >
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{
                        angle: -90,
                        fill: "#64748b",
                        position: "insideLeft",
                        value: "Replenishment %",
                      }}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)}%`,
                        name,
                      ]}
                      labelFormatter={(year) => `Year ${year}`}
                    />
                    <Legend />
                    {chartCompanies.map((company) => (
                      <Line
                        connectNulls
                        dataKey={company}
                        dot={{ r: 4 }}
                        key={company}
                        stroke={COMPANY_COLORS[company] ?? "#94a3b8"}
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
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Not all companies report replenishment percentage every year. Gaps
              reflect missing disclosures, not zero progress.
            </p>
          </section>

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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <h2 className="font-semibold text-slate-950">Reported figures</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">Company</th>
              <th className="px-4 py-3 font-semibold" scope="col">Year</th>
              <th className="px-4 py-3 font-semibold" scope="col">Withdrawal (gal)</th>
              <th className="px-4 py-3 font-semibold" scope="col">Consumption (gal)</th>
              <th className="px-4 py-3 font-semibold" scope="col">Replenishment</th>
              <th className="px-4 py-3 font-semibold" scope="col">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {disclosures.map((disclosure) => (
              <tr className="text-slate-700 hover:bg-slate-50" key={`${disclosure.company}-${disclosure.year}`}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">
                  {disclosure.company}
                </td>
                <td className="px-4 py-3">{disclosure.year}</td>
                <td className="px-4 py-3 tabular-nums">
                  {formatGallons(disclosure.withdrawal_gal)}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {formatGallons(disclosure.consumption_gal)}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {disclosure.replenishment_pct === null
                    ? "—"
                    : `${disclosure.replenishment_pct.toLocaleString()}%`}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <SourceTierBadge tier={disclosure.source_tier} />
                    <a
                      className="text-xs font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-700"
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
  return (
    <div aria-busy="true" aria-label="Loading corporate disclosures" className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-full max-w-lg animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
    </div>
  );
}

function formatGallons(value: number | null) {
  return value === null ? "—" : Math.round(value).toLocaleString();
}
