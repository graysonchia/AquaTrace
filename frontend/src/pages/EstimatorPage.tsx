import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
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
import {
  InstrumentTooltip,
} from "../components/ChartTheme";
import {
  CHART_GRID_STROKE,
  CHART_TICK,
} from "../components/chartStyles";
import { GaugeDivider } from "../components/GaugeDivider";
import { InstrumentLoading } from "../components/InstrumentLoading";
import { SourceTierBadge } from "../components/SourceTierBadge";

const SCOPE_COLORS: Record<string, string> = {
  on_site: "#A6D8D4",
  full_lifecycle: "#0B3142",
  operational: "#1C6E8C",
};

const SCOPE_LABELS: Record<string, string> = {
  on_site: "On-site",
  operational: "Operational",
  full_lifecycle: "Full lifecycle",
};

export function EstimatorPage() {
  const shouldReduceMotion = useReducedMotion();
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
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-river">
          Compare the evidence
        </p>
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-well">
          Methodology Estimator
        </h1>
        <p className="font-serif text-ink/70">
          Enter a query volume and see how differently each published
          methodology answers “how much water did that use?”
        </p>
      </div>

      <GaugeDivider label="Comparison Inputs" />

      <section className="space-y-6 rounded-sm border border-well/15 bg-paper p-6">
        <form
          className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 sm:max-w-56">
            <label
              className="mb-1 block font-display text-sm font-medium text-well"
              htmlFor="query-volume"
            >
              Query volume
            </label>
            <input
              className="w-full rounded-sm border border-well/25 px-3 py-2 font-mono text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-shallow/40"
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
              className="mb-1 block font-display text-sm font-medium text-well"
              htmlFor="period-label"
            >
              Period label
            </label>
            <input
              className="w-full rounded-sm border border-well/25 px-3 py-2 font-mono text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-shallow/40"
              id="period-label"
              maxLength={100}
              onChange={(event) => setPeriodLabel(event.target.value)}
              required
              type="text"
              value={periodLabel}
            />
          </div>
          <button
            className="rounded-sm bg-river px-5 py-2 font-mono text-xs font-medium uppercase tracking-wide text-white transition hover:bg-well focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-river focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-well/25"
            disabled={!formIsValid || compareMutation.isPending}
            type="submit"
          >
            {compareMutation.isPending ? "Comparing…" : "Compare"}
          </button>
        </form>

        {compareMutation.isError && (
          <div className="rounded-sm border border-drought/30 bg-drought/5 p-4 font-serif text-sm text-drought">
            The comparison could not be calculated. Check that the API is running
            and try again.
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-sm border border-well/15 bg-shallow/20 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-5xl font-bold tracking-tight text-drought">
                  {result.spread_ratio.toFixed(0)}×
                </p>
                <p className="mt-2 max-w-3xl font-serif text-sm leading-6 text-ink/70">
                  Spread between the lowest (
                  <span className="font-mono text-ink">
                    {formatLiters(result.min_liters)}
                  </span>
                  ) and highest (
                  <span className="font-mono text-ink">
                    {formatLiters(result.max_liters)}
                  </span>
                  ) estimates for the same{" "}
                  <span className="font-mono text-ink">
                    {result.query_volume.toLocaleString()}
                  </span>{" "}
                  queries <span className="font-mono text-ink">{result.period_label}</span>.
                </p>
              </div>
              <span className="shrink-0">
                <SourceTierBadge tier="modeled_estimate" />
              </span>
            </div>

            <GaugeDivider label="Methodology Range" />

            <div
              aria-label="Bar chart comparing total water estimates by methodology"
              className="h-80 w-full font-mono"
              role="img"
            >
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={result.results}
                  margin={{ bottom: 50, left: 12, right: 12, top: 8 }}
                >
                  <CartesianGrid
                    stroke={CHART_GRID_STROKE}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    angle={-15}
                    dataKey="source_name"
                    height={90}
                    interval={0}
                    textAnchor="end"
                    tick={CHART_TICK}
                  />
                  <YAxis
                    label={{
                      angle: -90,
                      fill: "#0B314299",
                      fontFamily: "IBM Plex Mono, monospace",
                      position: "insideLeft",
                      value: "Liters",
                    }}
                    tick={CHART_TICK}
                    tickFormatter={compactNumber}
                  />
                  <Tooltip
                    content={
                      <InstrumentTooltip
                        formatValue={(value) =>
                          `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="total_liters"
                    isAnimationActive={!shouldReduceMotion}
                    name="Estimated water"
                    radius={[5, 5, 0, 0]}
                  >
                    <LabelList
                      dataKey="total_liters"
                      fill="#0B3142"
                      fontFamily="IBM Plex Mono, monospace"
                      fontSize={11}
                      formatter={(value) => `${compactNumber(Number(value))} L`}
                      position="top"
                    />
                    {result.results.map((entry) => (
                      <Cell
                        fill={SCOPE_COLORS[entry.scope] ?? "#0B314280"}
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

      <GaugeDivider label="Source Methodologies" />

      <section className="rounded-sm border border-well/15 bg-paper p-6">
        <h2 className="mb-1 font-display text-lg font-bold text-well">
          Source methodologies
        </h2>
        <p className="mb-5 font-serif text-sm text-ink/60">
          Each coefficient measures a different boundary of water use.
        </p>

        {methodologiesQuery.isLoading && (
          <InstrumentLoading className="min-h-24" />
        )}
        {methodologiesQuery.isError && (
          <p className="font-serif text-sm text-drought">
            Source methodologies could not be loaded.
          </p>
        )}
        <div className="divide-y divide-well/10">
          {methodologiesQuery.data?.map((methodology) => (
            <article className="py-4 first:pt-0 last:pb-0" key={methodology.source_name}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: SCOPE_COLORS[methodology.scope] }}
                  />
                  <span className="font-display font-medium text-well">
                    {methodology.source_name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm font-medium text-ink/70">
                  {methodology.ml_per_query.toLocaleString()} mL/query ·{" "}
                  {SCOPE_LABELS[methodology.scope]}
                </span>
              </div>
              {methodology.notes && (
                <p className="mt-2 font-serif text-sm leading-6 text-ink/70">
                  {methodology.notes}
                </p>
              )}
              <a
                className="mt-2 inline-block font-mono text-xs font-medium uppercase tracking-wide text-river underline decoration-shallow underline-offset-4 hover:text-well"
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
