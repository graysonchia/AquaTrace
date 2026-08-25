import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  api,
  type StationEnergyCorrelation,
} from "../api/endpoints";
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

const ENERGY_SERIES = [
  { dataKey: "avg_coal", fill: "#C1440E", name: "Coal" },
  { dataKey: "avg_natural_gas", fill: "#C1440E99", name: "Natural gas" },
  { dataKey: "avg_nuclear", fill: "#0B3142", name: "Nuclear" },
  { dataKey: "avg_hydro", fill: "#1C6E8C", name: "Hydro" },
  { dataKey: "avg_solar", fill: "#A6D8D4", name: "Solar" },
  { dataKey: "avg_wind", fill: "#1C6E8C99", name: "Wind" },
] as const;

export function EnergyMixPage() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedStationIds, setSelectedStationIds] = useState<number[]>([]);
  const correlationQuery = useQuery({
    queryKey: ["energy-mix-correlation"],
    queryFn: api.getEnergyMixCorrelation,
  });

  const stations = useMemo(
    () => correlationQuery.data ?? [],
    [correlationQuery.data],
  );
  const renewableThreshold = useMemo(
    () => percentile(stations.map((station) => station.pct_renewable), 0.75),
    [stations],
  );
  const wueThreshold = useMemo(
    () => percentile(stations.map((station) => station.avg_offsite_wue), 0.75),
    [stations],
  );
  const outliers = useMemo(
    () =>
      stations.filter(
        (station) =>
          station.pct_renewable >= renewableThreshold &&
          station.avg_offsite_wue >= wueThreshold,
      ),
    [renewableThreshold, stations, wueThreshold],
  );
  const generalStations = useMemo(
    () => stations.filter((station) => !outliers.includes(station)),
    [outliers, stations],
  );

  const defaultStationIds = useMemo(
    () => contrastingStationIds(stations),
    [stations],
  );
  const effectiveStationIds =
    selectedStationIds.length > 0 ? selectedStationIds : defaultStationIds;

  if (correlationQuery.isLoading) {
    return <InstrumentLoading className="rounded-sm border border-well/15" />;
  }

  if (correlationQuery.isError) {
    return (
      <PageMessage
        title="Energy mix data could not be loaded"
        message="Check that the AquaTrace API and database are running, then refresh this page."
      />
    );
  }

  const selectedStations = effectiveStationIds
    .map((stationId) =>
      stations.find((station) => station.station_id === stationId),
    )
    .filter((station): station is StationEnergyCorrelation => Boolean(station));

  return (
    <div className="space-y-6">
      <div className="flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-river">
            Regional grid context
          </p>
          <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-well">
            Energy Mix &amp; Offsite Water
          </h1>
          <p className="max-w-3xl font-serif leading-7 text-ink/70">
            Offsite WUE varies because electricity generation itself can use
            substantial water for thermoelectric cooling at coal, gas, and
            nuclear plants. A data center&apos;s effective footprint therefore
            depends on its local grid as well as its own cooling efficiency.
            Hydro-heavy grids can show high, often non-consumptive withdrawals,
            while solar- and wind-heavy grids may reduce water use for reasons
            unrelated to the AI workload. The relationship is contextual—not a
            simple “renewable equals better” rule.
          </p>
        </div>
        <span className="shrink-0">
          <SourceTierBadge tier="modeled_estimate" />
        </span>
      </div>

      <GaugeDivider label="Regional Correlation" />

      {stations.length > 0 ? (
        <>
          <section className="rounded-sm border border-well/15 bg-paper p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-well">
                  Renewable share vs. offsite WUE
                </h2>
                <p className="mt-1 max-w-2xl font-serif text-sm text-ink/60">
                  Each point is one station using its latest available annual
                  energy mix and its average hourly offsite WUE.
                </p>
              </div>
              <span className="font-mono text-xs uppercase tracking-wide text-well/45">
                n={stations.length} stations
              </span>
            </div>

            <div
              aria-label="Scatter plot of renewable electricity share against average offsite water-use effectiveness"
              className="h-[420px] w-full font-mono"
              role="img"
            >
              <ResponsiveContainer height="100%" width="100%">
                <ScatterChart
                  margin={{ bottom: 24, left: 18, right: 18, top: 12 }}
                >
                  <CartesianGrid
                    stroke={CHART_GRID_STROKE}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="pct_renewable"
                    domain={[0, 100]}
                    label={{
                      fill: "#0B314299",
                      fontFamily: "IBM Plex Mono, monospace",
                      offset: -12,
                      position: "insideBottom",
                      value: "Renewable share (%)",
                    }}
                    name="Renewable share"
                    tick={CHART_TICK}
                    type="number"
                    unit="%"
                  />
                  <YAxis
                    dataKey="avg_offsite_wue"
                    domain={["auto", "auto"]}
                    label={{
                      angle: -90,
                      fill: "#0B314299",
                      fontFamily: "IBM Plex Mono, monospace",
                      position: "insideLeft",
                      value: "Offsite WUE (L/kWh)",
                    }}
                    name="Offsite WUE"
                    tick={CHART_TICK}
                    type="number"
                    unit=" L/kWh"
                  />
                  <Tooltip content={<CorrelationTooltip />} />
                  <Legend content={<InstrumentLegend />} />
                  <Scatter
                    data={generalStations}
                    fill="#1C6E8C"
                    isAnimationActive={!shouldReduceMotion}
                    name="Station"
                  />
                  {outliers.length > 0 && (
                    <Scatter
                      data={outliers}
                      fill="#C1440E"
                      isAnimationActive={!shouldReduceMotion}
                      name="High renewable / high WUE"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {outliers.length > 0 && (
              <p className="mt-3 border-l-2 border-drought pl-3 font-serif text-xs leading-5 text-ink/60">
                Exceptions highlighted in drought include{" "}
                <span className="font-mono text-ink">
                  {outliers.map(stationName).join(", ")}
                </span>
                . Their position is a reminder that generation technology,
                withdrawal versus consumption, climate, and regional operations
                complicate any simple causal reading.
              </p>
            )}
          </section>

          <GaugeDivider label="Station Mix Comparison" />

          <section className="rounded-sm border border-well/15 bg-paper p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold text-well">
                Compare contrasting grids
              </h2>
              <p className="mt-1 max-w-2xl font-serif text-sm text-ink/60">
                Select three stations to compare their latest coal, gas,
                nuclear, hydro, solar, and wind shares directly.
              </p>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map((slot) => (
                <label
                  className="font-display text-xs font-medium uppercase tracking-wide text-well/70"
                  key={slot}
                >
                  Station <span className="font-mono">{slot + 1}</span>
                  <select
                    className="mt-1 block w-full rounded-sm border border-well/25 bg-paper px-3 py-2 font-mono text-xs normal-case tracking-normal text-ink outline-none focus:border-river focus:ring-2 focus:ring-shallow/40"
                    onChange={(event) =>
                      setSelectedStationIds((current) =>
                        (current.length > 0 ? current : defaultStationIds).map(
                          (stationId, index) =>
                            index === slot
                              ? Number(event.target.value)
                              : stationId,
                        ),
                      )
                    }
                    value={effectiveStationIds[slot] ?? ""}
                  >
                    {stations.map((station) => (
                      <option
                        disabled={effectiveStationIds.some(
                          (stationId, index) =>
                            index !== slot && stationId === station.station_id,
                        )}
                        key={station.station_id}
                        value={station.station_id}
                      >
                        {stationName(station)} · {station.state}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div
              aria-label="Stacked bar chart comparing selected stations' electricity generation mix"
              className="h-[380px] w-full font-mono"
              role="img"
            >
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={selectedStations.map((station) => ({
                    ...station,
                    label: stationName(station),
                  }))}
                  margin={{ bottom: 20, left: 12, right: 12, top: 8 }}
                >
                  <CartesianGrid
                    stroke={CHART_GRID_STROKE}
                    strokeDasharray="3 3"
                  />
                  <XAxis dataKey="label" tick={CHART_TICK} />
                  <YAxis
                    domain={[0, 100]}
                    label={{
                      angle: -90,
                      fill: "#0B314299",
                      fontFamily: "IBM Plex Mono, monospace",
                      position: "insideLeft",
                      value: "Grid share (%)",
                    }}
                    tick={CHART_TICK}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={
                      <InstrumentTooltip
                        formatValue={(value) =>
                          `${Number(value).toFixed(1)}%`
                        }
                      />
                    }
                  />
                  <Legend content={<InstrumentLegend />} />
                  {ENERGY_SERIES.map((series) => (
                    <Bar
                      dataKey={series.dataKey}
                      fill={series.fill}
                      isAnimationActive={!shouldReduceMotion}
                      key={series.dataKey}
                      name={series.name}
                      stackId="energy-mix"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : (
        <PageMessage
          title="No energy mix summaries are available"
          message="Run the energy mix ingestion service after applying the latest database migration."
        />
      )}
    </div>
  );
}

function CorrelationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: StationEnergyCorrelation }>;
}) {
  const station = payload?.[0]?.payload;
  if (!active || !station) return null;

  return (
    <div className="min-w-52 rounded-sm border border-well/20 bg-paper px-3 py-2 shadow-[0_8px_24px_rgba(11,49,66,0.12)]">
      <p className="border-b border-well/10 pb-1.5 font-serif text-xs text-ink/60">
        {stationName(station)}, {station.state}
      </p>
      <dl className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <dt className="font-serif text-xs text-ink/60">Renewable share</dt>
          <dd className="font-mono text-xs font-medium text-well">
            {station.pct_renewable.toFixed(1)}%
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="font-serif text-xs text-ink/60">Offsite WUE</dt>
          <dd className="font-mono text-xs font-medium text-well">
            {station.avg_offsite_wue.toFixed(2)} L/kWh
          </dd>
        </div>
      </dl>
    </div>
  );
}

function contrastingStationIds(stations: StationEnergyCorrelation[]) {
  const byRenewable = [...stations].sort(
    (left, right) => left.pct_renewable - right.pct_renewable,
  );
  const byCoal = [...stations].sort(
    (left, right) => right.avg_coal - left.avg_coal,
  );
  const candidates = [
    byRenewable[0],
    byRenewable.at(-1),
    byCoal[0],
    ...stations,
  ];
  const stationIds = new Set<number>();

  candidates.forEach((station) => {
    if (station && stationIds.size < 3) stationIds.add(station.station_id);
  });

  return [...stationIds];
}

function percentile(values: number[], quantile: number) {
  if (values.length === 0) return Number.POSITIVE_INFINITY;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.floor((sorted.length - 1) * quantile);
  return sorted[index];
}

function stationName(station: StationEnergyCorrelation) {
  return station.city.replaceAll("-", " ");
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-sm border border-well/15 bg-paper p-6 text-center">
      <h2 className="font-display font-bold text-well">{title}</h2>
      <p className="mt-1 font-serif text-sm text-ink/70">{message}</p>
    </div>
  );
}
