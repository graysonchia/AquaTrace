import asyncio
from typing import TypedDict

from sqlalchemy.dialects.postgresql import insert

from app.database import async_session
from app.models.disclosure import CorporateDisclosure
from app.models.facility import SourceTier

GOOGLE_2024_REPORT = (
    "https://www.gstatic.com/gumdrop/sustainability/"
    "google-2024-environmental-report.pdf"
)
MICROSOFT_2025_REPORT = (
    "https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/"
    "msc/documents/presentations/CSR/"
    "2025-Microsoft-Environmental-Sustainability-Report.pdf"
)
AMAZON_2024_REPORT = (
    "https://sustainability.aboutamazon.com/content/dam/"
    "sustainability-marketing-site/pdfs/reports-docs/"
    "2024-amazon-sustainability-report.pdf"
)

M3_TO_US_GALLONS = 264.172052
MILLION_GALLONS = 1_000_000.0


class DisclosureRow(TypedDict):
    company: str
    year: int
    withdrawal_gal: float | None
    consumption_gal: float | None
    replenishment_pct: float | None
    source_url: str
    source_tier: SourceTier


def google_row(
    year: int,
    withdrawal_million_gal: float,
    consumption_million_gal: float,
    replenishment_pct: float | None = None,
) -> DisclosureRow:
    return {
        "company": "Google",
        "year": year,
        "withdrawal_gal": withdrawal_million_gal * MILLION_GALLONS,
        "consumption_gal": consumption_million_gal * MILLION_GALLONS,
        "replenishment_pct": replenishment_pct,
        "source_url": GOOGLE_2024_REPORT,
        "source_tier": SourceTier.corporate_disclosure,
    }


def microsoft_row(
    year: int,
    withdrawal_m3: float,
    consumption_m3: float,
) -> DisclosureRow:
    return {
        "company": "Microsoft",
        "year": year,
        "withdrawal_gal": withdrawal_m3 * M3_TO_US_GALLONS,
        "consumption_gal": consumption_m3 * M3_TO_US_GALLONS,
        "replenishment_pct": None,
        "source_url": MICROSOFT_2025_REPORT,
        "source_tier": SourceTier.corporate_disclosure,
    }


DISCLOSURES: list[DisclosureRow] = [
    # Google 2024 Environmental Report, Appendix water table (million US gal).
    google_row(2019, 5_160.7, 3_412.4),
    google_row(2020, 5_688.7, 3_748.9),
    google_row(2021, 6_296.6, 4_561.8),
    google_row(2022, 7_599.6, 5_564.7, replenishment_pct=6.0),
    google_row(2023, 8_653.3, 6_352.0, replenishment_pct=18.0),
    # Microsoft 2025 Environmental Sustainability Report, Water Table 5 (m3).
    microsoft_row(2020, 7_936_000, 4_196_000),
    microsoft_row(2021, 8_068_000, 4_773_000),
    microsoft_row(2022, 10_706_000, 6_399_000),
    microsoft_row(2023, 12_951_000, 7_844_000),
    microsoft_row(2024, 10_377_000, 5_807_000),
    # Amazon does not publish enterprise-wide withdrawal/consumption totals.
    # These percentages are AWS progress toward its water-positive goal.
    {
        "company": "Amazon (AWS)",
        "year": 2023,
        "withdrawal_gal": None,
        "consumption_gal": None,
        "replenishment_pct": 41.0,
        "source_url": AMAZON_2024_REPORT,
        "source_tier": SourceTier.corporate_disclosure,
    },
    {
        "company": "Amazon (AWS)",
        "year": 2024,
        "withdrawal_gal": None,
        "consumption_gal": None,
        "replenishment_pct": 53.0,
        "source_url": AMAZON_2024_REPORT,
        "source_tier": SourceTier.corporate_disclosure,
    },
]


async def seed() -> None:
    statement = insert(CorporateDisclosure).values(DISCLOSURES)
    statement = statement.on_conflict_do_update(
        constraint="uq_corporate_disclosure_year",
        set_={
            "withdrawal_gal": statement.excluded.withdrawal_gal,
            "consumption_gal": statement.excluded.consumption_gal,
            "replenishment_pct": statement.excluded.replenishment_pct,
            "source_url": statement.excluded.source_url,
            "source_tier": statement.excluded.source_tier,
        },
    )

    async with async_session() as session:
        await session.execute(statement)
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
