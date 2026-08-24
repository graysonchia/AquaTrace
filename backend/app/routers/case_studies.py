from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CaseStudy
from app.schemas.case_study import CaseStudyOut

router = APIRouter(prefix="/case-studies", tags=["case-studies"])


@router.get("", response_model=list[CaseStudyOut])
async def list_case_studies(db: AsyncSession = Depends(get_db)):
    statement = select(CaseStudy).order_by(CaseStudy.title)
    result = await db.execute(statement)
    return result.scalars().all()
