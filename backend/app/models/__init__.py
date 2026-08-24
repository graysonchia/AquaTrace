from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all AquaTrace database models."""


from app.models.disclosure import CorporateDisclosure  # noqa: E402, F401
from app.models.facility import SourceTier, WueReading, WueStation  # noqa: E402, F401
from app.models.methodology import (  # noqa: E402, F401
    MethodologyCoefficient,
    Scope,
)

__all__ = [
    "Base",
    "CorporateDisclosure",
    "MethodologyCoefficient",
    "Scope",
    "SourceTier",
    "WueReading",
    "WueStation",
]
