from __future__ import annotations

from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class CaseStudy(Base):
    __tablename__ = "case_studies"
    __table_args__ = (
        UniqueConstraint("title", name="uq_case_study_title"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    region: Mapped[str] = mapped_column(String(255))
    narrative: Mapped[str] = mapped_column(Text)
    key_stat: Mapped[str] = mapped_column(String(255))
    source_url: Mapped[str] = mapped_column(String(500))
