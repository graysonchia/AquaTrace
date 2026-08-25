from pydantic import BaseModel, ConfigDict


class EnergyMixOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    station_id: int
    year: int
    avg_coal: float
    avg_hydro: float
    avg_natural_gas: float
    avg_nuclear: float
    avg_other: float
    avg_petroleum: float
    avg_solar: float
    avg_wind: float
    pct_renewable: float


class StationEnergyCorrelation(BaseModel):
    station_id: int
    city: str
    state: str
    avg_offsite_wue: float
    pct_renewable: float
    avg_coal: float
    avg_natural_gas: float
    avg_hydro: float
    avg_nuclear: float
    avg_solar: float
    avg_wind: float
