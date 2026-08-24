from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import WueReading, WueStation
from app.schemas.wue import WueReadingOut, WueStationOut, WueStationSummary

router = APIRouter(prefix="/wue", tags=["wue"])


@router.get("/stations", response_model=list[WueStationOut])
async def list_stations(db: AsyncSession = Depends(get_db)):
    statement = select(WueStation).order_by(WueStation.state, WueStation.city)
    result = await db.execute(statement)
    return result.scalars().all()


@router.get("/stations/summary", response_model=list[WueStationSummary])
async def stations_summary(db: AsyncSession = Depends(get_db)):
    """Return average WUE per station for map and overview clients."""
    statement = (
        select(
            WueStation.id.label("station_id"),
            WueStation.city,
            WueStation.state,
            WueStation.latitude,
            WueStation.longitude,
            func.avg(WueReading.onsite_wue).label("avg_onsite_wue"),
            func.avg(WueReading.offsite_wue).label("avg_offsite_wue"),
            func.count(WueReading.id).label("reading_count"),
        )
        .join(WueReading, WueReading.station_id == WueStation.id)
        .group_by(WueStation.id)
        .order_by(WueStation.state, WueStation.city)
    )
    result = await db.execute(statement)
    return result.mappings().all()


@router.get(
    "/stations/{station_id}/readings",
    response_model=list[WueReadingOut],
)
async def station_readings(
    station_id: int,
    start: date | None = Query(None, description="Inclusive ISO date, e.g. 2022-01-01"),
    end: date | None = Query(None, description="Inclusive ISO date, e.g. 2022-12-31"),
    limit: int = Query(1000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Return a bounded page of hourly readings for one station."""
    if start and end and start > end:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start must be on or before end",
        )

    station_exists = await db.scalar(
        select(WueStation.id).where(WueStation.id == station_id)
    )
    if station_exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="WUE station not found",
        )

    statement = select(WueReading).where(WueReading.station_id == station_id)
    if start:
        statement = statement.where(
            WueReading.timestamp >= datetime.combine(start, time.min)
        )
    if end:
        exclusive_end = datetime.combine(end + timedelta(days=1), time.min)
        statement = statement.where(WueReading.timestamp < exclusive_end)

    statement = (
        statement.order_by(WueReading.timestamp)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(statement)
    return result.scalars().all()
