from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import MethodologyCoefficient
from app.schemas.estimator import (
    EstimatorRequest,
    EstimatorResponse,
    EstimatorResult,
    MethodologyOut,
)

router = APIRouter(prefix="/estimator", tags=["estimator"])


@router.get("/methodologies", response_model=list[MethodologyOut])
async def list_methodologies(db: AsyncSession = Depends(get_db)):
    statement = select(MethodologyCoefficient).order_by(
        MethodologyCoefficient.ml_per_query,
        MethodologyCoefficient.source_name,
    )
    result = await db.execute(statement)
    return result.scalars().all()


@router.post("/compare", response_model=EstimatorResponse)
async def compare(
    payload: EstimatorRequest,
    db: AsyncSession = Depends(get_db),
):
    statement = select(MethodologyCoefficient).order_by(
        MethodologyCoefficient.ml_per_query,
        MethodologyCoefficient.source_name,
    )
    result = await db.execute(statement)
    coefficients = result.scalars().all()
    if not coefficients:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Methodology coefficients have not been configured",
        )

    results = [
        EstimatorResult(
            source_name=coefficient.source_name,
            scope=coefficient.scope,
            total_liters=(coefficient.ml_per_query * payload.query_volume) / 1000,
            ml_per_query=coefficient.ml_per_query,
            citation_url=coefficient.citation_url,
        )
        for coefficient in coefficients
    ]

    liters_values = [result.total_liters for result in results]
    min_liters = min(liters_values)
    max_liters = max(liters_values)

    return EstimatorResponse(
        query_volume=payload.query_volume,
        period_label=payload.period_label,
        results=results,
        min_liters=min_liters,
        max_liters=max_liters,
        spread_ratio=max_liters / min_liters,
    )
