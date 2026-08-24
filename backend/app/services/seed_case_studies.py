import asyncio

from sqlalchemy.dialects.postgresql import insert

from app.database import async_session
from app.models import CaseStudy


CASE_STUDIES = [
    {
        "title": "Meta's El Paso Data Center — A Public Water Allocation",
        "region": "El Paso, Texas",
        "narrative": (
            "The City of El Paso describes Meta's planned AI campus as a $1.5 "
            "billion project with water allocations that rise by phase. Tier II "
            "allows an average of 750,000 gallons per day and a maximum of 1 "
            "million; at full Tier III build-out, the average allocation is 1.5 "
            "million and the maximum is 2.5 million gallons per day."
        ),
        "key_stat": (
            "750,000 gal/day Tier II average; 2.5M gal/day full-build maximum"
        ),
        "source_url": "https://www.elpasotexas.gov/data-centers",
    },
    {
        "title": "Butts County, Georgia — A $10B Project Set to Triple Water Use",
        "region": "Butts County, Georgia",
        "narrative": (
            "A proposed $10 billion mixed development containing 11 million "
            "square feet of data centers is expected to use more than 4.5 "
            "million gallons of water per day, more than tripling Butts County's "
            "current use. WABE reports that the figures come from a two-page "
            "Development of Regional Impact filing, while key cooling details "
            "remain undisclosed."
        ),
        "key_stat": "More than 4.5M gal/day; over 3× current county use",
        "source_url": (
            "https://www.wabe.org/massive-burt-jones-backed-project-among-wave-"
            "of-data-centers-proposed-for-georgia/"
        ),
    },
    {
        "title": "Meta's Stanton Springs Campus — A Water-Positive Pledge",
        "region": "Newton County, Georgia",
        "narrative": (
            "Meta states that its Stanton Springs campus obtains its operational "
            "water through the Newton County Water and Sewerage Authority and "
            "does not use groundwater. The company says efficiency and watershed "
            "restoration projects support its goal of becoming water positive by "
            "2030; this is a corporate commitment, not a verified outcome."
        ),
        "key_stat": "Company water-positive target: 2030",
        "source_url": (
            "https://datacenters.atmeta.com/2026/04/"
            "operating-responsibly-at-the-stanton-springs-data-center/"
        ),
    },
    {
        "title": "Industry Baseline — Water Use by Large U.S. Data Centers",
        "region": "United States (national)",
        "narrative": (
            "Indiana University's One Water program reports that a large data "
            "center can use up to 5 million gallons per day, comparable to a town "
            "of 10,000 to 50,000 people. Its fact sheet estimates collective U.S. "
            "data-center consumption at 449 million gallons per day, or 163.7 "
            "billion gallons annually, in 2021."
        ),
        "key_stat": (
            "Up to 5M gal/day per large facility; 449M gal/day U.S. estimate"
        ),
        "source_url": (
            "https://onewater.igws.iu.edu/files/Data%20Centers-Water%20Costs.pdf"
        ),
    },
]


async def seed() -> None:
    async with async_session() as session:
        for case_study in CASE_STUDIES:
            statement = insert(CaseStudy).values(**case_study)
            statement = statement.on_conflict_do_update(
                constraint="uq_case_study_title",
                set_={
                    "region": statement.excluded.region,
                    "narrative": statement.excluded.narrative,
                    "key_stat": statement.excluded.key_stat,
                    "source_url": statement.excluded.source_url,
                },
            )
            await session.execute(statement)
        await session.commit()

    print(f"Seeded {len(CASE_STUDIES)} case studies.")


if __name__ == "__main__":
    asyncio.run(seed())
