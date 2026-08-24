# AquaTrace

AquaTrace is an evidence-aware explorer for the water footprint of AI and data
centers. It combines station-level water-use effectiveness (WUE), regional water
stress, corporate disclosures, published per-query estimates, scenario forecasts,
and human-scale equivalents in one interface.

The project is designed around a simple principle: a number is incomplete without
its provenance. AquaTrace therefore labels figures by source quality and keeps
citations close to the claims they support.

## What the product does

- Summarizes average on-site and off-site WUE across 58 U.S. cities.
- Maps those stations against state-level WRI Aqueduct water stress.
- Compares three published AI water methodologies that differ by roughly 173×.
- Shows company-reported withdrawal, consumption, and replenishment history.
- Projects five-year off-site WUE under efficiency and demand-growth scenarios.
- Grounds aggregate figures in named case studies.
- Converts personal monthly AI usage into liters and everyday equivalents.

## Source-tier methodology

AquaTrace uses four provenance tiers. The tiers describe how a figure was
produced; they are not a universal ranking of accuracy.

| Tier | Meaning | How AquaTrace uses it |
| --- | --- | --- |
| **Peer-Reviewed** | Evidence published through academic research and its associated research data. | Station WUE readings and summaries derived from the 58-city research dataset. |
| **Corporate Disclosure** | A figure reported directly by a company in an environmental or sustainability disclosure. | Google, Microsoft, and AWS withdrawal, consumption, and replenishment records. |
| **Modeled Estimate** | A value calculated from coefficients, statistical models, or scenario assumptions. | Per-query comparisons, personal-footprint totals, equivalents, and ARIMA-based forecasts. |
| **Aggregator Estimate** | A value compiled or synthesized by a third-party data aggregator. | Reserved for estimates that enter the product through aggregator sources. |

The visual badges answer “what kind of evidence backs this number?” They do not
mean that every peer-reviewed result transfers perfectly to every facility, or
that a corporate disclosure has been independently audited. Scope, geography,
time period, system boundaries, and reporting conventions still matter.

This distinction is especially important for per-query AI estimates. The current
coefficients cover different boundaries:

- **On-site:** data-center cooling water only.
- **Operational:** on-site cooling plus water associated with electricity supply.
- **Full lifecycle:** operational impacts plus upstream lifecycle boundaries used
  by the source methodology.

Comparing those coefficients side by side is intentional. AquaTrace does not
collapse fundamentally different scopes into a false single “correct” number.

## Data foundations

- [58-city WUE research dataset (OSF)](https://osf.io/g3zvd/files/osfstorage)
- [WRI Aqueduct 4.0 water-stress rankings](https://www.wri.org/data/aqueduct-40-country-rankings)
- [Google AI inference environmental methodology](https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference)
- [UC Riverside water footprint of AI models](https://arxiv.org/pdf/2304.03271)
- [Mistral lifecycle methodology](https://mistral.ai/news/our-contribution-to-a-global-environmental-standard-for-ai)
- Company environmental reports linked directly from each disclosure row.
- Primary or named sources linked directly from every case-study card.

Water-stress scores are used as geographic context rather than a facility-specific
water allocation. Forecasts are scenario illustrations fitted to a short annual
history; they are not precise predictions of future facility demand.

## Architecture

```text
frontend/  React 19, TypeScript, Vite, Tailwind CSS, TanStack Query,
           Recharts, React Leaflet, Axios

backend/   FastAPI, SQLAlchemy 2 async, asyncpg, Alembic, Pydantic,
           pandas, statsmodels

database   PostgreSQL
```

The React app calls a typed API client and lazy-loads non-overview routes. The
FastAPI service exposes async SQLAlchemy queries over normalized stations,
readings, disclosures, methodology coefficients, forecasts, water-stress records,
and case studies.

## Local setup

### 1. PostgreSQL

Create a PostgreSQL database named `aquatrace`. Adjust the username, password,
host, port, or database name in `backend/.env` for your local installation.

### 2. Backend

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`; `GET /health` verifies the PostgreSQL
round trip.

### 3. Data population

Download the OSF CSV as:

```text
backend/data/water_dataset_v_05.14.24.csv
```

Then, from `backend/`, run:

```powershell
python -m app.services.ingest_wue
python -m app.services.seed_disclosures
python -m app.services.seed_methodology
python -m app.services.seed_water_stress
python -m app.services.seed_case_studies
python -m app.services.forecast_demand
```

The seed operations are designed to be repeatable. Generate the forecast after
the WUE readings have been ingested.

### 4. Frontend

From `frontend/`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The frontend defaults to `http://localhost:5173` and reads the API base URL from
`VITE_API_URL`.

## Main API routes

| Route | Purpose |
| --- | --- |
| `GET /health` | Database-backed health check |
| `GET /wue/stations/summary` | Average WUE by station |
| `GET /wue/stations/with-stress` | Station summaries joined to water stress |
| `GET /corporate-disclosures` | Corporate water records |
| `GET /estimator/methodologies` | Published per-query coefficients |
| `POST /estimator/compare` | Side-by-side methodology estimates |
| `POST /estimator/personal` | Personal footprint and equivalents |
| `GET /forecast/water-demand` | Five-year scenario projections |
| `GET /case-studies` | Named, sourced examples |

Interactive API documentation is available at `http://localhost:8000/docs` while
the backend is running.

## Validation

From `frontend/`:

```powershell
npm run lint
npm run build
```

## Responsible interpretation

AquaTrace is an educational and exploratory tool. Results depend on published
system boundaries and assumptions, and should not be treated as a meter reading
for a specific prompt, model, facility, user, or watershed. The interface keeps
scope, source type, citations, uncertainty ranges, and missing disclosures
visible so users can evaluate the evidence instead of seeing unsupported
precision.
