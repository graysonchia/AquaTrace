from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import EnergyMixSummary, WueReading, WueStation
from app.schemas.energy_mix import EnergyMixOut, StationEnergyCorrelation

router = APIRouter(prefix="/energy-mix", tags=["energy-mix"])


@router.get("/by-station", response_model=list[EnergyMixOut])
async def energy_mix_by_station(db: AsyncSession = Depends(get_db)):
    statement = select(EnergyMixSummary).order_by(
        EnergyMixSummary.station_id,
        EnergyMixSummary.year,
    )
    result = await db.execute(statement)
    return result.scalars().all()


@router.get("/correlation", response_model=list[StationEnergyCorrelation])
async def energy_mix_correlation(db: AsyncSession = Depends(get_db)):
    """Return latest energy mix and all-time average offsite WUE per station."""
    wue_averages = (
        select(
            WueReading.station_id,
            func.avg(WueReading.offsite_wue).label("avg_offsite_wue"),
        )
        .where(WueReading.offsite_wue.is_not(None))
        .group_by(WueReading.station_id)
        .subquery()
    )
    latest_energy_year = (
        select(
            EnergyMixSummary.station_id,
            func.max(EnergyMixSummary.year).label("year"),
        )
        .group_by(EnergyMixSummary.station_id)
        .subquery()
    )

    statement = (
        select(
            WueStation.id.label("station_id"),
            WueStation.city,
            WueStation.state,
            wue_averages.c.avg_offsite_wue,
            EnergyMixSummary.pct_renewable,
            EnergyMixSummary.avg_coal,
            EnergyMixSummary.avg_natural_gas,
            EnergyMixSummary.avg_hydro,
            EnergyMixSummary.avg_nuclear,
            EnergyMixSummary.avg_solar,
            EnergyMixSummary.avg_wind,
        )
        .join(wue_averages, wue_averages.c.station_id == WueStation.id)
        .join(
            latest_energy_year,
            latest_energy_year.c.station_id == WueStation.id,
        )
        .join(
            EnergyMixSummary,
            and_(
                EnergyMixSummary.station_id == WueStation.id,
                EnergyMixSummary.year == latest_energy_year.c.year,
            ),
        )
        .order_by(WueStation.state, WueStation.city)
    )
    result = await db.execute(statement)
    return result.mappings().all()
