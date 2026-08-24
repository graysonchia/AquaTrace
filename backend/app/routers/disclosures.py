from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CorporateDisclosure
from app.schemas.disclosure import CorporateDisclosureOut

router = APIRouter(prefix="/corporate-disclosures", tags=["disclosures"])


@router.get("", response_model=list[CorporateDisclosureOut])
async def list_disclosures(
    company: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    statement = select(CorporateDisclosure)
    if company:
        statement = statement.where(CorporateDisclosure.company == company)
    statement = statement.order_by(CorporateDisclosure.company, CorporateDisclosure.year)
    result = await db.execute(statement)
    return result.scalars().all()


@router.get(
    "/replenishment-progress",
    response_model=list[CorporateDisclosureOut],
)
async def replenishment_progress(db: AsyncSession = Depends(get_db)):
    """Return disclosure history for the replenishment-versus-target chart."""
    statement = select(CorporateDisclosure).order_by(
        CorporateDisclosure.company,
        CorporateDisclosure.year,
    )
    result = await db.execute(statement)
    return result.scalars().all()
