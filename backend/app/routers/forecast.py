from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import WaterDemandForecast
from app.models.forecast import ForecastScenario
from app.schemas.forecast import ForecastOut

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/water-demand", response_model=list[ForecastOut])
async def get_forecast(
    scenario: ForecastScenario | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    statement = select(WaterDemandForecast)
    if scenario is not None:
        statement = statement.where(WaterDemandForecast.scenario == scenario)
    statement = statement.order_by(
        WaterDemandForecast.scenario,
        WaterDemandForecast.forecast_year,
    )
    result = await db.execute(statement)
    return result.scalars().all()
