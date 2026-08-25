from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class EnergyMixSummary(Base):
    __tablename__ = "energy_mix_summary"
    __table_args__ = (
        UniqueConstraint(
            "station_id",
            "year",
            name="uq_energy_mix_station_year",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    station_id: Mapped[int] = mapped_column(
        ForeignKey("wue_stations.id", ondelete="CASCADE"),
        index=True,
    )
    year: Mapped[int] = mapped_column(Integer)
    avg_coal: Mapped[float] = mapped_column(Float)
    avg_hydro: Mapped[float] = mapped_column(Float)
    avg_natural_gas: Mapped[float] = mapped_column(Float)
    avg_nuclear: Mapped[float] = mapped_column(Float)
    avg_other: Mapped[float] = mapped_column(Float)
    avg_petroleum: Mapped[float] = mapped_column(Float)
    avg_solar: Mapped[float] = mapped_column(Float)
    avg_wind: Mapped[float] = mapped_column(Float)
    # Nuclear is low-carbon but is intentionally excluded from renewable share.
    pct_renewable: Mapped[float] = mapped_column(Float)
