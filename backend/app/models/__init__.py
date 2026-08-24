from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all AquaTrace database models."""


__all__ = ["Base"]
