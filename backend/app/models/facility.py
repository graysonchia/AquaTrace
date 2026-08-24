from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class SourceTier(str, enum.Enum):
    peer_reviewed = "peer_reviewed"
    corporate_disclosure = "corporate_disclosure"
    modeled_estimate = "modeled_estimate"
    aggregator_estimate = "aggregator_estimate"


source_tier_enum = Enum(SourceTier, name="source_tier")


class WueStation(Base):
    __tablename__ = "wue_stations"
    __table_args__ = (
        UniqueConstraint("city", "state", name="uq_wue_station_city_state"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    city: Mapped[str] = mapped_column(String(255))
    state: Mapped[str] = mapped_column(String(100))
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    readings: Mapped[list[WueReading]] = relationship(
        back_populates="station",
        cascade="all, delete-orphan",
    )


class WueReading(Base):
    __tablename__ = "wue_readings"
    __table_args__ = (
        UniqueConstraint("station_id", "timestamp", name="uq_wue_reading_timestamp"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    station_id: Mapped[int] = mapped_column(
        ForeignKey("wue_stations.id", ondelete="CASCADE"),
        index=True,
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime)
    onsite_wue: Mapped[float | None] = mapped_column(Float, nullable=True)
    offsite_wue: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_tier: Mapped[SourceTier] = mapped_column(
        source_tier_enum,
        default=SourceTier.peer_reviewed,
    )

    station: Mapped[WueStation] = relationship(back_populates="readings")

