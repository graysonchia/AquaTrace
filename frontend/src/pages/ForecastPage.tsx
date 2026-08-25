import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, type ForecastPoint } from "../api/endpoints";
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

const SCENARIO_LABELS: Record<ForecastPoint["scenario"], string> = {
  efficiency_improves: "Efficiency Improves",
  demand_outpaces: "Demand Outpaces Efficiency",
};

const SCENARIO_COLORS: Record<ForecastPoint["scenario"], string> = {
  efficiency_improves: "#1C6E8C",
  demand_outpaces: "#C1440E",
};

type Scenario = ForecastPoint["scenario"];

interface ForecastChartRow {
  year: number;
  efficiency_improves_predicted?: number;
  efficiency_improves_band?: [number, number];
  demand_outpaces_predicted?: number;
  demand_outpaces_band?: [number, number];
}

export function ForecastPage() {
  const shouldReduceMotion = useReducedMotion();
  const [scenario, setScenario] = useState<Scenario | undefined>();
  const forecastQuery = useQuery({
    queryKey: ["forecast", scenario ?? "both"],
    queryFn: () => api.getForecast(scenario),
  });

  const chartData = reshapeForecast(forecastQuery.data ?? []);

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-river">
          Scenario exploration
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-well">
              Water Demand Forecast
            </h1>
            <p className="font-serif text-ink/70">
              National average offsite WUE projected under two scenarios. Built
              on five years of real data—treat this as a scenario illustration,
              not a precise prediction.
            </p>
          </div>
          <span className="shrink-0">
            <SourceTierBadge tier="modeled_estimate" />
          </span>
        </div>
      </div>

      <GaugeDivider label="Scenario Selection" />

      <div aria-label="Forecast scenario filter" className="flex flex-wrap gap-2">
        <ScenarioButton
          active={!scenario}
          label="Both scenarios"
          onClick={() => setScenario(undefined)}
        />
        {(Object.entries(SCENARIO_LABELS) as [Scenario, string][]).map(
          ([key, label]) => (
            <ScenarioButton
              active={scenario === key}
              key={key}
              label={label}
              onClick={() => setScenario(key)}
            />
          ),
        )}
      </div>

      <GaugeDivider label="Projected WUE" />

      <section className="rounded-sm border border-well/15 bg-paper p-4 sm:p-6">
        {forecastQuery.isLoading ? (
          <InstrumentLoading className="h-[400px]" />
        ) : forecastQuery.isError ? (
          <ChartMessage
            title="The forecast could not be loaded"
            message="Check that the AquaTrace API and database are running, then try again."
          />
        ) : chartData.length === 0 ? (
          <ChartMessage
            title="No forecast points are available"
            message="The selected scenario did not return any forecast data."
          />
        ) : (
          <div
            aria-label="Line chart comparing projected offsite water-use effectiveness scenarios"
            className={`h-[400px] font-mono transition-opacity ${forecastQuery.isFetching ? "opacity-60" : "opacity-100"}`}
            role="img"
          >
            <ResponsiveContainer height="100%" width="100%">
              <ComposedChart
                data={chartData}
                margin={{ bottom: 8, left: 18, right: 18, top: 8 }}
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
                  domain={["auto", "auto"]}
                  label={{
                    angle: -90,
                    fill: "#0B314299",
                    fontFamily: "IBM Plex Mono, monospace",
                    position: "insideLeft",
                    value: "Offsite WUE (L/kWh)",
                  }}
                  tick={CHART_TICK}
                />
                <Tooltip
                  content={
                    <InstrumentTooltip
                      formatLabel={(label) => `Year ${String(label)}`}
                      formatValue={(value) => {
                        if (Array.isArray(value)) {
                          return `${Number(value[0]).toFixed(2)}–${Number(value[1]).toFixed(2)} L/kWh`;
                        }
                        return `${Number(value).toFixed(2)} L/kWh`;
                      }}
                    />
                  }
                />
                <Legend content={<InstrumentLegend />} />
                {(!scenario || scenario === "efficiency_improves") && (
                  <>
                    <Area
                      dataKey="efficiency_improves_band"
                      fill={SCENARIO_COLORS.efficiency_improves}
                      fillOpacity={0.13}
                      isAnimationActive={!shouldReduceMotion}
                      legendType="none"
                      name="Efficiency range"
                      stroke="none"
                      type="monotone"
                    />
                    <Line
                      connectNulls
                      dataKey="efficiency_improves_predicted"
                      dot={{ r: 3 }}
                      isAnimationActive={!shouldReduceMotion}
                      name={SCENARIO_LABELS.efficiency_improves}
                      stroke={SCENARIO_COLORS.efficiency_improves}
                      strokeWidth={3}
                      type="monotone"
                    />
                  </>
                )}
                {(!scenario || scenario === "demand_outpaces") && (
                  <>
                    <Area
                      dataKey="demand_outpaces_band"
                      fill={SCENARIO_COLORS.demand_outpaces}
                      fillOpacity={0.13}
                      isAnimationActive={!shouldReduceMotion}
                      legendType="none"
                      name="Demand range"
                      stroke="none"
                      type="monotone"
                    />
                    <Line
                      connectNulls
                      dataKey="demand_outpaces_predicted"
                      dot={{ r: 3 }}
                      isAnimationActive={!shouldReduceMotion}
                      name={SCENARIO_LABELS.demand_outpaces}
                      stroke={SCENARIO_COLORS.demand_outpaces}
                      strokeWidth={3}
                      type="monotone"
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <GaugeDivider label="Model Context" />

      <p className="rounded-sm border border-well/15 bg-shallow/20 px-4 py-3 font-serif text-xs leading-5 text-ink/70">
        With only five years of historical data, these scenarios are modeled
        projections applying a divergence factor to a single fitted trend—not two
        independently trained models. Shaded regions show each projection&apos;s
        lower-to-upper range.
      </p>
    </div>
  );
}

function ScenarioButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`rounded-sm border border-transparent px-3 py-2 font-mono text-xs font-medium uppercase tracking-wide text-white transition hover:bg-well focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-river focus-visible:ring-offset-2 ${
        active
          ? "bg-well"
          : "bg-river"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function reshapeForecast(points: ForecastPoint[]): ForecastChartRow[] {
  const rows = new Map<number, ForecastChartRow>();

  points.forEach((point) => {
    const row = rows.get(point.forecast_year) ?? { year: point.forecast_year };

    if (point.scenario === "efficiency_improves") {
      row.efficiency_improves_predicted = point.predicted_avg_offsite_wue;
      row.efficiency_improves_band = [point.lower_bound, point.upper_bound];
    } else {
      row.demand_outpaces_predicted = point.predicted_avg_offsite_wue;
      row.demand_outpaces_band = [point.lower_bound, point.upper_bound];
    }

    rows.set(point.forecast_year, row);
  });

  return [...rows.values()].sort((left, right) => left.year - right.year);
}

function ChartMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-[400px] items-center justify-center text-center">
      <div>
        <h2 className="font-display font-bold text-well">{title}</h2>
        <p className="mt-1 font-serif text-sm text-ink/70">{message}</p>
      </div>
    </div>
  );
}
