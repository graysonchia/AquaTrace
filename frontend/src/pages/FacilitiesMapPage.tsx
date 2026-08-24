import { useQuery } from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import { api, type WueStationWithStress } from "../api/endpoints";
import { SourceTierBadge } from "../components/SourceTierBadge";

const STRESS_COLORS: Record<string, string> = {
  Low: "#22c55e",
  "Low-Medium": "#84cc16",
  "Medium-High": "#eab308",
  High: "#f97316",
  "Extremely High": "#ef4444",
};

const UNKNOWN_STRESS_COLOR = "#94a3b8";

type MappableStation = WueStationWithStress & {
  latitude: number;
  longitude: number;
};

export function FacilitiesMapPage() {
  const stationsQuery = useQuery({
    queryKey: ["stations-with-stress"],
    queryFn: api.getStationsWithStress,
  });

  if (stationsQuery.isLoading) {
    return <MapLoadingState />;
  }

  if (stationsQuery.isError) {
    return (
      <MapMessage
        title="The facilities map could not be loaded"
        message="Check that the AquaTrace API and database are running, then refresh this page."
      />
    );
  }

  const stations = stationsQuery.data ?? [];
  const mappableStations = stations.filter(isMappableStation);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          58-city research dataset
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Facilities Map — WUE × Water Stress
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Explore station-level water-use effectiveness alongside regional water
          stress. Select a marker for measurements and source quality.
        </p>
      </div>

      <div
        aria-label="Water stress legend"
        className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
      >
        {Object.entries(STRESS_COLORS).map(([label, color]) => (
          <div className="flex items-center gap-1.5" key={label}>
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: UNKNOWN_STRESS_COLOR }}
          />
          Not available
        </div>
      </div>

      {mappableStations.length > 0 ? (
        <div className="h-[600px] min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
          <MapContainer
            center={[39.5, -98.35]}
            className="h-full w-full"
            scrollWheelZoom
            zoom={4}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappableStations.map((station) => {
              const markerColor =
                STRESS_COLORS[station.stress_category ?? ""] ??
                UNKNOWN_STRESS_COLOR;

              return (
                <CircleMarker
                  center={[station.latitude, station.longitude]}
                  key={station.station_id}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.72,
                    weight: 2,
                  }}
                  radius={8}
                >
                  <Popup>
                    <div className="min-w-52 space-y-1.5 text-sm text-slate-700">
                      <div className="font-semibold text-slate-950">
                        {station.city}, {station.state}
                      </div>
                      <div>
                        Onsite WUE: {station.avg_onsite_wue.toFixed(2)} L/kWh
                      </div>
                      <div>
                        Offsite WUE: {station.avg_offsite_wue.toFixed(2)} L/kWh
                      </div>
                      <div>
                        Water Stress: {station.stress_category ?? "Not available"}
                      </div>
                      <div className="pt-1">
                        <SourceTierBadge tier={station.source_tier} />
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      ) : (
        <MapMessage
          title="No mapped stations are available"
          message="The API returned no stations with usable latitude and longitude values."
        />
      )}

      {mappableStations.length < stations.length && (
        <p className="text-xs text-slate-500">
          {stations.length - mappableStations.length} station
          {stations.length - mappableStations.length === 1 ? " was" : "s were"} omitted
          because coordinates were unavailable.
        </p>
      )}
    </div>
  );
}

function isMappableStation(
  station: WueStationWithStress,
): station is MappableStation {
  return station.latitude !== null && station.longitude !== null;
}

function MapLoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading facilities map" className="space-y-5">
      <div className="space-y-3">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-full max-w-xl animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-[600px] min-h-[420px] animate-pulse rounded-xl border border-slate-200 bg-slate-200" />
    </div>
  );
}

function MapMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
    </div>
  );
}
