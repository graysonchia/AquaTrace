import asyncio
from datetime import date

import numpy as np
import pandas as pd
from sqlalchemy import Integer, cast, delete, extract, func, select
from sqlalchemy.dialects.postgresql import insert
from statsmodels.tsa.arima.model import ARIMA

from app.database import async_session
from app.models import WaterDemandForecast, WueReading
from app.models.forecast import ForecastScenario

HORIZON_YEARS = 5
CONFIDENCE_LEVEL = 0.80
SCENARIO_MULTIPLIERS = {
    ForecastScenario.efficiency_improves: 0.6,
    ForecastScenario.demand_outpaces: 1.4,
}


async def load_yearly_national_avg() -> pd.Series:
    """Aggregate hourly off-site WUE into yearly national averages in Postgres."""
    year = cast(extract("year", WueReading.timestamp), Integer).label("year")
    average_wue = func.avg(WueReading.offsite_wue).label("average_wue")
    statement = (
        select(year, average_wue)
        .where(WueReading.offsite_wue.is_not(None))
        .group_by(year)
        .order_by(year)
    )

    async with async_session() as session:
        rows = (await session.execute(statement)).all()

    yearly = pd.Series(
        data=[float(row.average_wue) for row in rows],
        index=pd.Index([int(row.year) for row in rows], name="year"),
        name="offsite_wue",
        dtype=float,
    )
    if len(yearly) < 3:
        raise ValueError("At least three annual WUE observations are required")
    if not np.isfinite(yearly.to_numpy()).all() or (yearly <= 0).any():
        raise ValueError("Historical annual WUE values must be finite and positive")
    return yearly


def run_arima_forecast(
    yearly: pd.Series,
    growth_multiplier: float,
) -> pd.DataFrame:
    """Fit one historical ARIMA trend and apply a transparent scenario pressure."""
    if growth_multiplier <= 0:
        raise ValueError("growth_multiplier must be positive")

    fit = ARIMA(yearly.to_numpy(), order=(1, 1, 0)).fit()
    forecast_result = fit.get_forecast(steps=HORIZON_YEARS)
    mean_forecast = np.asarray(forecast_result.predicted_mean, dtype=float)
    confidence_interval = np.asarray(
        forecast_result.conf_int(alpha=1 - CONFIDENCE_LEVEL),
        dtype=float,
    )

    time_index = np.arange(len(yearly), dtype=float)
    historical_slope = float(np.polyfit(time_index, yearly.to_numpy(), 1)[0])
    annual_change_magnitude = max(abs(historical_slope), float(yearly.iloc[-1]) * 0.01)
    steps = np.arange(1, HORIZON_YEARS + 1, dtype=float)
    adjustment = (growth_multiplier - 1.0) * annual_change_magnitude * steps

    predicted = np.maximum(0.0, mean_forecast + adjustment)
    lower = np.maximum(0.0, confidence_interval[:, 0] + adjustment)
    upper = np.maximum(predicted, confidence_interval[:, 1] + adjustment)
    lower = np.minimum(lower, predicted)

    first_forecast_year = int(yearly.index.max()) + 1
    return pd.DataFrame(
        {
            "year": np.arange(
                first_forecast_year,
                first_forecast_year + HORIZON_YEARS,
            ),
            "predicted": predicted,
            "lower": lower,
            "upper": upper,
        }
    )


async def generate_and_store_forecasts() -> None:
    yearly = await load_yearly_national_avg()
    print(f"Historical yearly averages:\n{yearly.to_string()}")

    forecasts = {
        scenario: run_arima_forecast(yearly, multiplier)
        for scenario, multiplier in SCENARIO_MULTIPLIERS.items()
    }
    target_years = [int(year) for year in next(iter(forecasts.values()))["year"]]
    generated_on = date.today()

    async with async_session() as session:
        await session.execute(
            delete(WaterDemandForecast).where(
                WaterDemandForecast.scenario.in_(list(SCENARIO_MULTIPLIERS)),
                WaterDemandForecast.forecast_year.not_in(target_years),
            )
        )
        for scenario, forecast in forecasts.items():
            for row in forecast.itertuples(index=False):
                statement = insert(WaterDemandForecast).values(
                    scenario=scenario,
                    forecast_year=int(row.year),
                    predicted_avg_offsite_wue=float(row.predicted),
                    lower_bound=float(row.lower),
                    upper_bound=float(row.upper),
                    model_used="arima",
                    generated_on=generated_on,
                )
                statement = statement.on_conflict_do_update(
                    constraint="uq_forecast_scenario_year",
                    set_={
                        "predicted_avg_offsite_wue": (
                            statement.excluded.predicted_avg_offsite_wue
                        ),
                        "lower_bound": statement.excluded.lower_bound,
                        "upper_bound": statement.excluded.upper_bound,
                        "model_used": statement.excluded.model_used,
                        "generated_on": statement.excluded.generated_on,
                    },
                )
                await session.execute(statement)
        await session.commit()

    print(f"Stored {len(SCENARIO_MULTIPLIERS) * HORIZON_YEARS} forecasts.")


if __name__ == "__main__":
    asyncio.run(generate_and_store_forecasts())
