import { apiClient } from "./client";

export type SourceTier =
  | "peer_reviewed"
  | "corporate_disclosure"
  | "modeled_estimate"
  | "aggregator_estimate";

export interface HealthResponse {
  status: string;
}

export interface WueStation {
  id: number;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  source_tier: SourceTier;
}

export interface WueStationSummary {
  station_id: number;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  avg_onsite_wue: number;
  avg_offsite_wue: number;
  reading_count: number;
  source_tier: SourceTier;
}

export interface WueStationWithStress extends WueStationSummary {
  stress_category: string | null;
  stress_score: number | null;
}

export interface WueReading {
  id: number;
  station_id: number;
  timestamp: string;
  onsite_wue: number | null;
  offsite_wue: number | null;
  source_tier: SourceTier;
}

export interface CorporateDisclosure {
  id: number;
  company: string;
  year: number;
  withdrawal_gal: number | null;
  consumption_gal: number | null;
  replenishment_pct: number | null;
  source_url: string;
  source_tier: SourceTier;
}

export interface MethodologyCoefficient {
  source_name: string;
  scope: "on_site" | "operational" | "full_lifecycle";
  ml_per_query: number;
  citation_url: string;
  notes: string | null;
}

export interface EstimatorResult {
  source_name: string;
  scope: MethodologyCoefficient["scope"];
  total_liters: number;
  ml_per_query: number;
  citation_url: string;
}

export interface EstimatorCompareResponse {
  query_volume: number;
  period_label: string;
  results: EstimatorResult[];
  min_liters: number;
  max_liters: number;
  spread_ratio: number;
}

export interface ForecastPoint {
  scenario: "efficiency_improves" | "demand_outpaces";
  forecast_year: number;
  predicted_avg_offsite_wue: number;
  lower_bound: number;
  upper_bound: number;
  model_used: string;
  generated_on: string;
}

export interface WaterStress {
  state: string;
  stress_score: number;
  stress_category: string;
  source: string;
  year: number;
}

export interface EnergyMixSummary {
  id: number;
  station_id: number;
  year: number;
  avg_coal: number;
  avg_hydro: number;
  avg_natural_gas: number;
  avg_nuclear: number;
  avg_other: number;
  avg_petroleum: number;
  avg_solar: number;
  avg_wind: number;
  pct_renewable: number;
}

export interface StationEnergyCorrelation {
  station_id: number;
  city: string;
  state: string;
  avg_offsite_wue: number;
  pct_renewable: number;
  avg_coal: number;
  avg_natural_gas: number;
  avg_hydro: number;
  avg_nuclear: number;
  avg_solar: number;
  avg_wind: number;
}

export interface CaseStudy {
  title: string;
  region: string;
  narrative: string;
  key_stat: string;
  source_url: string;
}

export interface PersonalEstimatorResponse {
  monthly_queries: number;
  methodology_used: string;
  total_liters: number;
  equivalents: Record<string, number>;
}

export interface StationReadingsParams {
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
}

export const api = {
  getHealth: () =>
    apiClient.get<HealthResponse>("/health").then((response) => response.data),
  getStations: () =>
    apiClient.get<WueStation[]>("/wue/stations").then((response) => response.data),
  getStationsSummary: () =>
    apiClient
      .get<WueStationSummary[]>("/wue/stations/summary")
      .then((response) => response.data),
  getStationsWithStress: () =>
    apiClient
      .get<WueStationWithStress[]>("/wue/stations/with-stress")
      .then((response) => response.data),
  getStationReadings: (id: number, params?: StationReadingsParams) =>
    apiClient
      .get<WueReading[]>(`/wue/stations/${id}/readings`, { params })
      .then((response) => response.data),
  getDisclosures: (company?: string) =>
    apiClient
      .get<CorporateDisclosure[]>("/corporate-disclosures", {
        params: company ? { company } : undefined,
      })
      .then((response) => response.data),
  getReplenishmentProgress: () =>
    apiClient
      .get<CorporateDisclosure[]>(
        "/corporate-disclosures/replenishment-progress",
      )
      .then((response) => response.data),
  getMethodologies: () =>
    apiClient
      .get<MethodologyCoefficient[]>("/estimator/methodologies")
      .then((response) => response.data),
  compareEstimator: (query_volume: number, period_label: string) =>
    apiClient
      .post<EstimatorCompareResponse>("/estimator/compare", {
        query_volume,
        period_label,
      })
      .then((response) => response.data),
  personalEstimate: (
    monthly_queries: number,
    methodology_source_name?: string,
  ) =>
    apiClient
      .post<PersonalEstimatorResponse>("/estimator/personal", {
        monthly_queries,
        methodology_source_name,
      })
      .then((response) => response.data),
  getForecast: (scenario?: ForecastPoint["scenario"]) =>
    apiClient
      .get<ForecastPoint[]>("/forecast/water-demand", {
        params: scenario ? { scenario } : undefined,
      })
      .then((response) => response.data),
  getWaterStress: () =>
    apiClient
      .get<WaterStress[]>("/water-stress/by-region")
      .then((response) => response.data),
  getEnergyMixByStation: () =>
    apiClient
      .get<EnergyMixSummary[]>("/energy-mix/by-station")
      .then((response) => response.data),
  getEnergyMixCorrelation: () =>
    apiClient
      .get<StationEnergyCorrelation[]>("/energy-mix/correlation")
      .then((response) => response.data),
  getCaseStudies: () =>
    apiClient
      .get<CaseStudy[]>("/case-studies")
      .then((response) => response.data),
};
