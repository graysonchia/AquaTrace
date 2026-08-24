from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.forecast import ForecastScenario


class ForecastOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scenario: ForecastScenario
    forecast_year: int
    predicted_avg_offsite_wue: float
    lower_bound: float
    upper_bound: float
    model_used: str
    generated_on: date
