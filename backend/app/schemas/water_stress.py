from pydantic import BaseModel, ConfigDict


class WaterStressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    state: str
    stress_score: float
    stress_category: str
    source: str
    year: int
