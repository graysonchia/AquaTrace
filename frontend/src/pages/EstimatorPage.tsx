import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../api/endpoints";
import { SourceTierBadge } from "../components/SourceTierBadge";

const SCOPE_COLORS: Record<string, string> = {
  on_site: "#3b82f6",
  full_lifecycle: "#8b5cf6",
  operational: "#06b6d4",
};

const SCOPE_LABELS: Record<string, string> = {
  on_site: "On-site",
  operational: "Operational",
  full_lifecycle: "Full lifecycle",
};

export function EstimatorPage() {
  const [queryVolume, setQueryVolume] = useState(1_000_000);
  const [periodLabel, setPeriodLabel] = useState("per month");

  const methodologiesQuery = useQuery({
    queryKey: ["methodologies"],
    queryFn: api.getMethodologies,
  });
  const compareMutation = useMutation({
    mutationFn: () => api.compareEstimator(queryVolume, periodLabel.trim()),
  });

  const result = compareMutation.data;
  const formIsValid =
    Number.isFinite(queryVolume) &&
    queryVolume > 0 &&
    queryVolume <= 1_000_000_000_000 &&
    periodLabel.trim().length > 0 &&
    periodLabel.trim().length <= 100;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formIsValid) compareMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Compare the evidence
        </p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">
          Methodology Estimator
        </h1>
        <p className="text-slate-600">
          Enter a query volume and see how differently each published
          methodology answers “how much water did that use?”
        </p>
      </div>

      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 sm:max-w-56">
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="query-volume"
            >
              Query volume
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              id="query-volume"
              max={1_000_000_000_000}
              min={1}
              onChange={(event) => setQueryVolume(event.target.valueAsNumber)}
              required
              type="number"
              value={Number.isNaN(queryVolume) ? "" : queryVolume}
            />
          </div>
          <div className="flex-1 sm:max-w-56">
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="period-label"
            >
              Period label
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              id="period-label"
              maxLength={100}
              onChange={(event) => setPeriodLabel(event.target.value)}
              required
              type="text"
              value={periodLabel}
            />
          </div>
          <button
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!formIsValid || compareMutation.isPending}
            type="submit"
          >
            {compareMutation.isPending ? "Comparing…" : "Compare"}
          </button>
        </form>

        {compareMutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            The comparison could not be calculated. Check that the API is running
            and try again.
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm leading-6 text-amber-950">
                <span className="text-lg font-bold">
                  {result.spread_ratio.toFixed(0)}× spread
                </span>{" "}
                between the lowest ({formatLiters(result.min_liters)}) and highest
                ({formatLiters(result.max_liters)}) estimates for the same{" "}
                {result.query_volume.toLocaleString()} queries {result.period_label}.
              </p>
              <span className="shrink-0">
                <SourceTierBadge tier="modeled_estimate" />
              </span>
            </div>

            <div
              aria-label="Bar chart comparing total water estimates by methodology"
              className="h-80 w-full"
              role="img"
            >
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={result.results}
                  margin={{ bottom: 50, left: 12, right: 12, top: 8 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis
                    angle={-15}
                    dataKey="source_name"
                    height={90}
                    interval={0}
                    textAnchor="end"
                    tick={{ fill: "#475569", fontSize: 11 }}
                  />
                  <YAxis
                    label={{
                      angle: -90,
                      fill: "#64748b",
                      position: "insideLeft",
                      value: "Liters",
                    }}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={compactNumber}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`,
                      "Estimated water",
                    ]}
                  />
                  <Bar dataKey="total_liters" radius={[5, 5, 0, 0]}>
                    <LabelList
                      dataKey="total_liters"
                      fill="#334155"
                      fontSize={11}
                      formatter={(value) => `${compactNumber(Number(value))} L`}
                      position="top"
                    />
                    {result.results.map((entry) => (
                      <Cell
                        fill={SCOPE_COLORS[entry.scope] ?? "#94a3b8"}
                        key={entry.source_name}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Source methodologies</h2>
        <p className="mb-5 text-sm text-slate-500">
          Each coefficient measures a different boundary of water use.
        </p>

        {methodologiesQuery.isLoading && (
          <p className="text-sm text-slate-500">Loading methodologies…</p>
        )}
        {methodologiesQuery.isError && (
          <p className="text-sm text-red-700">
            Source methodologies could not be loaded.
          </p>
        )}
        <div className="divide-y divide-slate-100">
          {methodologiesQuery.data?.map((methodology) => (
            <article className="py-4 first:pt-0 last:pb-0" key={methodology.source_name}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: SCOPE_COLORS[methodology.scope] }}
                  />
                  <span className="font-medium text-slate-900">
                    {methodology.source_name}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-medium text-slate-600">
                  {methodology.ml_per_query.toLocaleString()} mL/query ·{" "}
                  {SCOPE_LABELS[methodology.scope]}
                </span>
              </div>
              {methodology.notes && (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {methodology.notes}
                </p>
              )}
              <a
                className="mt-2 inline-block text-xs font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-700"
                href={methodology.citation_url}
                rel="noreferrer"
                target="_blank"
              >
                View source
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatLiters(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} L`;
}

function compactNumber(value: number) {
  return Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}
