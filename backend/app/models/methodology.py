from __future__ import annotations

import enum

from sqlalchemy import CheckConstraint, Enum, Float, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Scope(str, enum.Enum):
    on_site = "on_site"
    operational = "operational"
    full_lifecycle = "full_lifecycle"


scope_enum = Enum(Scope, name="scope")


class MethodologyCoefficient(Base):
    __tablename__ = "methodology_coefficients"
    __table_args__ = (
        CheckConstraint("ml_per_query > 0", name="ck_methodology_ml_per_query_positive"),
        UniqueConstraint("source_name", name="uq_methodology_source_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    source_name: Mapped[str] = mapped_column(String(100))
    scope: Mapped[Scope] = mapped_column(scope_enum)
    ml_per_query: Mapped[float] = mapped_column(Float)
    citation_url: Mapped[str] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
