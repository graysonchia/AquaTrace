import asyncio

from sqlalchemy.dialects.postgresql import insert

from app.database import async_session
from app.models import WaterStressIndex

SOURCE_URL = "https://www.wri.org/data/aqueduct-40-country-rankings"
BASELINE_END_YEAR = 2019

# WRI Aqueduct 4.0 provincial baseline water stress (bws), total-demand
# weighting (Tot). Scores and categories come from WRI's official rankings
# workbook, published in 2023 and based on the 1979-2019 baseline period.
STRESS_DATA: list[tuple[str, float, str]] = [
    ("Alabama", 1.469102708, "Low-Medium"),
    ("Arizona", 4.392122413, "Extremely High"),
    ("Arkansas", 2.618590566, "Medium-High"),
    ("California", 4.025594624, "Extremely High"),
    ("Colorado", 4.281222084, "Extremely High"),
    ("Connecticut", 0.908192803, "Low"),
    ("Delaware", 3.346309522, "High"),
    ("District of Columbia", 0.701148628, "Low"),
    ("Florida", 3.098215428, "High"),
    ("Georgia", 2.219663497, "Medium-High"),
    ("Idaho", 4.008868880, "Extremely High"),
    ("Illinois", 2.402912456, "Medium-High"),
    ("Indiana", 2.000937756, "Medium-High"),
    ("Iowa", 1.082368030, "Low-Medium"),
    ("Kansas", 3.625130285, "High"),
    ("Kentucky", 1.325810920, "Low-Medium"),
    ("Louisiana", 1.444670115, "Low-Medium"),
    ("Maine", 0.209677123, "Low"),
    ("Maryland", 1.575973448, "Low-Medium"),
    ("Massachusetts", 1.886745384, "Low-Medium"),
    ("Michigan", 1.129329028, "Low-Medium"),
    ("Minnesota", 2.265655880, "Medium-High"),
    ("Mississippi", 1.116355248, "Low-Medium"),
    ("Missouri", 1.432586340, "Low-Medium"),
    ("Montana", 2.699176055, "Medium-High"),
    ("Nebraska", 4.158685547, "Extremely High"),
    ("Nevada", 3.569639288, "High"),
    ("New Hampshire", 1.373573688, "Low-Medium"),
    ("New Jersey", 2.475232555, "Medium-High"),
    ("New Mexico", 4.324930145, "Extremely High"),
    ("New York", 1.224174637, "Low-Medium"),
    ("North Carolina", 3.190720720, "High"),
    ("North Dakota", 1.268492938, "Low-Medium"),
    ("Ohio", 1.561858114, "Low-Medium"),
    ("Oklahoma", 1.789030751, "Low-Medium"),
    ("Oregon", 1.603367247, "Low-Medium"),
    ("Pennsylvania", 1.647216746, "Low-Medium"),
    ("Rhode Island", 2.188356914, "Medium-High"),
    ("South Carolina", 2.714396732, "Medium-High"),
    ("South Dakota", 1.562557900, "Low-Medium"),
    ("Tennessee", 1.422878717, "Low-Medium"),
    ("Texas", 3.329698739, "High"),
    ("Utah", 3.165877291, "High"),
    ("Vermont", 0.455359951, "Low"),
    ("Virginia", 2.562448902, "Medium-High"),
    ("Washington", 1.203172775, "Low-Medium"),
    ("Wisconsin", 2.692841656, "Medium-High"),
    ("Wyoming", 3.765395727, "High"),
]


async def seed() -> None:
    async with async_session() as session:
        for state, stress_score, stress_category in STRESS_DATA:
            statement = insert(WaterStressIndex).values(
                state=state,
                stress_score=stress_score,
                stress_category=stress_category,
                source=SOURCE_URL,
                year=BASELINE_END_YEAR,
            )
            statement = statement.on_conflict_do_update(
                constraint="uq_water_stress_state",
                set_={
                    "stress_score": statement.excluded.stress_score,
                    "stress_category": statement.excluded.stress_category,
                    "source": statement.excluded.source,
                    "year": statement.excluded.year,
                },
            )
            await session.execute(statement)
        await session.commit()

    print(f"Seeded {len(STRESS_DATA)} WRI Aqueduct state stress records.")


if __name__ == "__main__":
    asyncio.run(seed())
