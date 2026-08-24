import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { SourceTierBadge } from "../components/SourceTierBadge";

const SCENARIO_LABELS: Record<ForecastPoint["scenario"], string> = {
  efficiency_improves: "Efficiency Improves",
  demand_outpaces: "Demand Outpaces Efficiency",
};

const SCENARIO_COLORS: Record<ForecastPoint["scenario"], string> = {
  efficiency_improves: "#16a34a",
  demand_outpaces: "#dc2626",
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
  const [scenario, setScenario] = useState<Scenario | undefined>();
  const forecastQuery = useQuery({
    queryKey: ["forecast", scenario ?? "both"],
    queryFn: () => api.getForecast(scenario),
  });

  const chartData = reshapeForecast(forecastQuery.data ?? []);

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Scenario exploration
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">
              Water Demand Forecast
            </h1>
            <p className="text-slate-600">
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {forecastQuery.isLoading ? (
          <div
            aria-label="Loading forecast"
            className="h-[400px] animate-pulse rounded-lg bg-slate-100"
          />
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
            className={`h-[400px] transition-opacity ${forecastQuery.isFetching ? "opacity-60" : "opacity-100"}`}
            role="img"
          >
            <ResponsiveContainer height="100%" width="100%">
              <ComposedChart
                data={chartData}
                margin={{ bottom: 8, left: 18, right: 18, top: 8 }}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  label={{
                    angle: -90,
                    fill: "#64748b",
                    position: "insideLeft",
                    value: "Offsite WUE (L/kWh)",
                  }}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (Array.isArray(value)) {
                      return [
                        `${Number(value[0]).toFixed(2)}–${Number(value[1]).toFixed(2)} L/kWh`,
                        name,
                      ];
                    }
                    return [`${Number(value).toFixed(2)} L/kWh`, name];
                  }}
                  labelFormatter={(year) => `Year ${year}`}
                />
                <Legend />
                {(!scenario || scenario === "efficiency_improves") && (
                  <>
                    <Area
                      dataKey="efficiency_improves_band"
                      fill={SCENARIO_COLORS.efficiency_improves}
                      fillOpacity={0.13}
                      legendType="none"
                      name="Efficiency range"
                      stroke="none"
                      type="monotone"
                    />
                    <Line
                      connectNulls
                      dataKey="efficiency_improves_predicted"
                      dot={{ r: 3 }}
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
                      legendType="none"
                      name="Demand range"
                      stroke="none"
                      type="monotone"
                    />
                    <Line
                      connectNulls
                      dataKey="demand_outpaces_predicted"
                      dot={{ r: 3 }}
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

      <p className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-xs leading-5 text-slate-600">
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
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
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
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}
