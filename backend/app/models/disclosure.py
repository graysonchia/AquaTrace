from sqlalchemy import Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base
from app.models.facility import SourceTier, source_tier_enum


class CorporateDisclosure(Base):
    __tablename__ = "corporate_disclosures"
    __table_args__ = (
        UniqueConstraint("company", "year", name="uq_corporate_disclosure_year"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company: Mapped[str] = mapped_column(String(100))
    year: Mapped[int] = mapped_column(Integer)
    withdrawal_gal: Mapped[float | None] = mapped_column(Float, nullable=True)
    consumption_gal: Mapped[float | None] = mapped_column(Float, nullable=True)
    replenishment_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_url: Mapped[str] = mapped_column(String(500))
    source_tier: Mapped[SourceTier] = mapped_column(
        source_tier_enum,
        default=SourceTier.corporate_disclosure,
    )
