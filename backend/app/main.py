from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    case_studies,
    disclosures,
    energy_mix,
    estimator,
    forecast,
    health,
    water_stress,
    wue,
)

app = FastAPI(title="AquaTrace API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(wue.router)
app.include_router(disclosures.router)
app.include_router(energy_mix.router)
app.include_router(estimator.router)
app.include_router(forecast.router)
app.include_router(water_stress.router)
app.include_router(case_studies.router)
