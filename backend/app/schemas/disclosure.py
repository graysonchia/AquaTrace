from pydantic import BaseModel, ConfigDict

from app.models.facility import SourceTier


class CorporateDisclosureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    year: int
    withdrawal_gal: float | None
    consumption_gal: float | None
    replenishment_pct: float | None
    source_url: str
    source_tier: SourceTier
