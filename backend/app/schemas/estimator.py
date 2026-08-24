from pydantic import BaseModel, ConfigDict, Field

from app.models.methodology import Scope


class MethodologyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source_name: str
    scope: Scope
    ml_per_query: float
    citation_url: str
    notes: str | None


class EstimatorRequest(BaseModel):
    query_volume: int = Field(gt=0, le=1_000_000_000_000)
    period_label: str = Field(default="total", min_length=1, max_length=100)


class EstimatorResult(BaseModel):
    source_name: str
    scope: Scope
    total_liters: float
    ml_per_query: float
    citation_url: str


class EstimatorResponse(BaseModel):
    query_volume: int
    period_label: str
    results: list[EstimatorResult]
    min_liters: float
    max_liters: float
    spread_ratio: float
