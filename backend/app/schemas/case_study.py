from pydantic import BaseModel, ConfigDict


class CaseStudyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    region: str
    narrative: str
    key_stat: str
    source_url: str
