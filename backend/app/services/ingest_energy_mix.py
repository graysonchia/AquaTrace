import asyncio
from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.database import async_session
from app.models import EnergyMixSummary, WueStation

CSV_PATH = Path(__file__).resolve().parents[2] / "data" / "water_dataset_v_05.14.24.csv"
CHUNK_SIZE = 250_000
ENERGY_COLUMNS = [
    "COAL",
    "HYDRO",
    "NATURALGAS",
    "NUCLEAR",
    "OTHER",
    "PETROLEUM",
    "SOLAR",
    "WIND",
]
USE_COLUMNS = ["CITY", "TIMESTAMP", *ENERGY_COLUMNS]
MODEL_FIELDS = {
    "COAL": "avg_coal",
    "HYDRO": "avg_hydro",
    "NATURALGAS": "avg_natural_gas",
    "NUCLEAR": "avg_nuclear",
    "OTHER": "avg_other",
    "PETROLEUM": "avg_petroleum",
    "SOLAR": "avg_solar",
    "WIND": "avg_wind",
}


def normalize_city(value: str) -> str:
    """Match the hyphenated city convention used by wue_stations."""
    return "-".join(str(value).strip().split())


def aggregate_energy_mix() -> pd.DataFrame:
    """Return average percentage shares indexed by normalized city and year."""
    totals = pd.DataFrame()
    counts = pd.DataFrame()
    processed_rows = 0

    reader = pd.read_csv(
        CSV_PATH,
        usecols=USE_COLUMNS,
        chunksize=CHUNK_SIZE,
    )
    for chunk in reader:
        timestamps = pd.to_datetime(chunk["TIMESTAMP"], errors="coerce")
        valid_timestamps = timestamps.notna()
        chunk = chunk.loc[valid_timestamps].copy()
        timestamps = timestamps.loc[valid_timestamps]
        chunk["city_key"] = chunk["CITY"].map(normalize_city)
        chunk["year"] = timestamps.dt.year.astype(int)

        energy = chunk[ENERGY_COLUMNS].apply(pd.to_numeric, errors="coerce")
        energy = energy.clip(lower=0)
        hourly_totals = energy.sum(axis=1, min_count=1)

        # Source columns contain hourly generation amounts. Normalize each hour
        # before averaging so stored values are comparable percentage shares.
        shares = energy.div(hourly_totals.where(hourly_totals > 0), axis=0) * 100
        shares["city_key"] = chunk["city_key"]
        shares["year"] = chunk["year"]

        grouped = shares.groupby(["city_key", "year"])[ENERGY_COLUMNS]
        chunk_totals = grouped.sum(min_count=1)
        chunk_counts = grouped.count()
        totals = chunk_totals if totals.empty else totals.add(chunk_totals, fill_value=0)
        counts = chunk_counts if counts.empty else counts.add(chunk_counts, fill_value=0)

        processed_rows += len(chunk)
        print(f"Processed {processed_rows:,} source rows...")

    averages = totals.divide(counts.where(counts > 0))
    return averages.reset_index()


async def ingest() -> None:
    print(f"Reading energy columns from {CSV_PATH}...")
    summaries = aggregate_energy_mix()
    print(f"Computed {len(summaries):,} city-year summaries.")

    async with async_session() as session:
        station_rows = (
            await session.execute(select(WueStation.id, WueStation.city))
        ).all()
        stations_by_city = {
            normalize_city(city): station_id for station_id, city in station_rows
        }

        values = []
        skipped_city_years = []
        for row in summaries.itertuples(index=False):
            station_id = stations_by_city.get(row.city_key)
            if station_id is None:
                skipped_city_years.append((row.city_key, int(row.year)))
                continue

            energy_values = {
                model_field: float(getattr(row, csv_column))
                for csv_column, model_field in MODEL_FIELDS.items()
            }
            values.append(
                {
                    "station_id": station_id,
                    "year": int(row.year),
                    **energy_values,
                    "pct_renewable": energy_values["avg_hydro"]
                    + energy_values["avg_solar"]
                    + energy_values["avg_wind"],
                }
            )

        if values:
            statement = insert(EnergyMixSummary).values(values)
            update_fields = {
                field: getattr(statement.excluded, field)
                for field in [*MODEL_FIELDS.values(), "pct_renewable"]
            }
            statement = statement.on_conflict_do_update(
                constraint="uq_energy_mix_station_year",
                set_=update_fields,
            )
            await session.execute(statement)
            await session.commit()

    if skipped_city_years:
        skipped_cities = sorted({city for city, _ in skipped_city_years})
        print(
            "Warning: skipped "
            f"{len(skipped_city_years):,} city-year rows across "
            f"{len(skipped_cities):,} unmatched cities: "
            f"{', '.join(skipped_cities)}"
        )

    print("Energy mix ingestion complete.")
    print(f"Rows inserted or updated: {len(values):,}")
    print(f"Rows skipped: {len(skipped_city_years):,}")


if __name__ == "__main__":
    asyncio.run(ingest())
