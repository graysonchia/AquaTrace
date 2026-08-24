from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import WaterStressIndex
from app.schemas.water_stress import WaterStressOut

router = APIRouter(prefix="/water-stress", tags=["water-stress"])


@router.get("/by-region", response_model=list[WaterStressOut])
async def by_region(db: AsyncSession = Depends(get_db)):
    statement = select(WaterStressIndex).order_by(WaterStressIndex.state)
    result = await db.execute(statement)
    return result.scalars().all()
