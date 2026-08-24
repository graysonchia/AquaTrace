from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all AquaTrace database models."""


from app.models.case_study import CaseStudy  # noqa: E402, F401
from app.models.disclosure import CorporateDisclosure  # noqa: E402, F401
from app.models.facility import SourceTier, WueReading, WueStation  # noqa: E402, F401
from app.models.forecast import (  # noqa: E402, F401
    ForecastScenario,
    WaterDemandForecast,
)
from app.models.methodology import (  # noqa: E402, F401
    MethodologyCoefficient,
    Scope,
)
from app.models.water_stress import WaterStressIndex  # noqa: E402, F401

__all__ = [
    "Base",
    "CaseStudy",
    "CorporateDisclosure",
    "ForecastScenario",
    "MethodologyCoefficient",
    "Scope",
    "SourceTier",
    "WueReading",
    "WueStation",
    "WaterDemandForecast",
    "WaterStressIndex",
]
