from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.facility import SourceTier


class WueStationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    city: str
    state: str
    latitude: float | None
    longitude: float | None
    source_tier: SourceTier = SourceTier.peer_reviewed


class WueReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    station_id: int
    timestamp: datetime
    onsite_wue: float | None
    offsite_wue: float | None
    source_tier: SourceTier


class WueStationSummary(BaseModel):
    """Average WUE per station for map and overview clients."""

    station_id: int
    city: str
    state: str
    latitude: float | None
    longitude: float | None
    avg_onsite_wue: float
    avg_offsite_wue: float
    reading_count: int
    source_tier: SourceTier = SourceTier.peer_reviewed


class WueStationStressSummary(WueStationSummary):
    """Station WUE summary with its state-level WRI Aqueduct stress score."""

    stress_category: str | None
    stress_score: float | None
