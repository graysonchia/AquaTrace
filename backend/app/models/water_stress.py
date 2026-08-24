from __future__ import annotations

from sqlalchemy import CheckConstraint, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class WaterStressIndex(Base):
    __tablename__ = "water_stress_index"
    __table_args__ = (
        CheckConstraint(
            "stress_score >= 0 AND stress_score <= 5",
            name="ck_water_stress_score_range",
        ),
        CheckConstraint(
            "stress_category IN ('Low', 'Low-Medium', 'Medium-High', "
            "'High', 'Extremely High')",
            name="ck_water_stress_category",
        ),
        UniqueConstraint("state", name="uq_water_stress_state"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    state: Mapped[str] = mapped_column(String(100))
    stress_score: Mapped[float] = mapped_column(Float)
    stress_category: Mapped[str] = mapped_column(String(50))
    source: Mapped[str] = mapped_column(String(255))
    year: Mapped[int] = mapped_column(Integer)
