import asyncio
import math

import pandas as pd
import pgeocode
from sqlalchemy import select
from app.database import async_session
from app.models import WueStation, WueReading, SourceTier

CSV_PATH = "data/water_dataset_v_05.14.24.csv"
CHUNK_SIZE = 200_000


def nullable_float(value):
    if pd.isna(value):
        return None
    number = float(value)
    return number if math.isfinite(number) else None

async def get_or_create_stations(df_unique: pd.DataFrame) -> dict:
    """Geocode unique (CITY, ZIP) pairs and insert into wue_stations. Returns {(city, zip): station_id}."""
    nomi = pgeocode.Nominatim("us")
    station_map = {}

    async with async_session() as session:
        for _, row in df_unique.iterrows():
            city, zip_code = row["CITY"], str(row["ZIP"]).zfill(5)
            geo = nomi.query_postal_code(zip_code)
            state = geo.state_name if pd.notna(geo.state_name) else "Unknown"
            lat = float(geo.latitude) if pd.notna(geo.latitude) else None
            lon = float(geo.longitude) if pd.notna(geo.longitude) else None

            # Check if this city+state already exists (avoid duplicate stations across zips in same city)
            existing = await session.execute(
                select(WueStation).where(WueStation.city == city, WueStation.state == state)
            )
            station = existing.scalar_one_or_none()

            if station is None:
                station = WueStation(city=city, state=state, latitude=lat, longitude=lon)
                session.add(station)
                await session.flush()

            station_map[(city, zip_code)] = station.id

        await session.commit()

    return station_map


async def ingest_readings(station_map: dict):
    reader = pd.read_csv(CSV_PATH, chunksize=CHUNK_SIZE, dtype={"ZIP": str})

    total_rows = 0
    for chunk in reader:
        chunk["ZIP"] = chunk["ZIP"].str.zfill(5)

        async with async_session() as session:
            readings = []
            for _, row in chunk.iterrows():
                key = (row["CITY"], row["ZIP"])
                station_id = station_map.get(key)
                if station_id is None:
                    continue  # skip rows whose city/zip wasn't in the unique set (shouldn't happen)

                readings.append(
                    WueReading(
                        station_id=station_id,
                        timestamp=pd.to_datetime(row["TIMESTAMP"]),
                        onsite_wue=nullable_float(row.get("ONSITEWUEFIXEDAPPROACH")),
                        offsite_wue=nullable_float(row.get("OFFSITEWUE")),
                        source_tier=SourceTier.peer_reviewed,
                    )
                )

            session.add_all(readings)
            await session.commit()

        total_rows += len(chunk)
        print(f"Ingested {total_rows:,} rows so far...")


async def main():
    print("Reading unique city/zip pairs...")
    df_unique = pd.read_csv(CSV_PATH, usecols=["CITY", "ZIP"], dtype={"ZIP": str}).drop_duplicates()
    df_unique["ZIP"] = df_unique["ZIP"].str.zfill(5)
    print(f"Found {len(df_unique)} unique city/zip pairs.")

    print("Geocoding and creating stations...")
    station_map = await get_or_create_stations(df_unique)
    print(f"Created/matched {len(set(station_map.values()))} stations.")

    print("Ingesting readings in chunks...")
    await ingest_readings(station_map)
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
