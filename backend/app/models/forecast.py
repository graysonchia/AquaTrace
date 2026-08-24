from __future__ import annotations

import enum
from datetime import date

from sqlalchemy import CheckConstraint, Date, Enum, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class ForecastScenario(str, enum.Enum):
    efficiency_improves = "efficiency_improves"
    demand_outpaces = "demand_outpaces"


scenario_enum = Enum(ForecastScenario, name="forecast_scenario")


class WaterDemandForecast(Base):
    __tablename__ = "water_demand_forecasts"
    __table_args__ = (
        CheckConstraint(
            "lower_bound <= predicted_avg_offsite_wue",
            name="ck_forecast_lower_lte_prediction",
        ),
        CheckConstraint(
            "predicted_avg_offsite_wue <= upper_bound",
            name="ck_forecast_prediction_lte_upper",
        ),
        CheckConstraint("lower_bound >= 0", name="ck_forecast_lower_nonnegative"),
        UniqueConstraint(
            "scenario",
            "forecast_year",
            name="uq_forecast_scenario_year",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario: Mapped[ForecastScenario] = mapped_column(scenario_enum)
    forecast_year: Mapped[int] = mapped_column(Integer)
    predicted_avg_offsite_wue: Mapped[float] = mapped_column(Float)
    lower_bound: Mapped[float] = mapped_column(Float)
    upper_bound: Mapped[float] = mapped_column(Float)
    model_used: Mapped[str] = mapped_column(String(50))
    generated_on: Mapped[date] = mapped_column(Date)
