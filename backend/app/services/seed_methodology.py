import asyncio

from sqlalchemy.dialects.postgresql import insert

from app.database import async_session
from app.models import MethodologyCoefficient
from app.models.methodology import Scope


COEFFICIENTS = [
    {
        "source_name": "Google (Gemini Apps, on-site only)",
        "scope": Scope.on_site,
        "ml_per_query": 0.26,
        "citation_url": (
            "https://cloud.google.com/blog/products/infrastructure/"
            "measuring-the-environmental-impact-of-ai-inference"
        ),
        "notes": (
            "Median Gemini Apps text prompt. Water is based on data-center WUE; "
            "it excludes electricity-generation and embodied hardware water."
        ),
    },
    {
        "source_name": "Mistral (Le Chat, full lifecycle)",
        "scope": Scope.full_lifecycle,
        "ml_per_query": 45.0,
        "citation_url": (
            "https://mistral.ai/news/"
            "our-contribution-to-a-global-environmental-standard-for-ai"
        ),
        "notes": (
            "Marginal impact of a 400-token Le Chat response under Mistral's "
            "life-cycle assessment, including upstream impacts."
        ),
    },
    {
        "source_name": "UC Riverside (GPT-3 class model, representative)",
        "scope": Scope.operational,
        "ml_per_query": 25.0,
        "citation_url": "https://arxiv.org/pdf/2304.03271",
        "notes": (
            "Representative value within the paper's roughly 10-50 mL per "
            "medium-length GPT-3 request range. Covers on-site cooling and "
            "off-site electricity water; embodied hardware water is excluded."
        ),
    },
]


async def seed() -> None:
    async with async_session() as session:
        for coefficient in COEFFICIENTS:
            statement = insert(MethodologyCoefficient).values(**coefficient)
            statement = statement.on_conflict_do_update(
                index_elements=[MethodologyCoefficient.source_name],
                set_={
                    "scope": statement.excluded.scope,
                    "ml_per_query": statement.excluded.ml_per_query,
                    "citation_url": statement.excluded.citation_url,
                    "notes": statement.excluded.notes,
                },
            )
            await session.execute(statement)
        await session.commit()

    print(f"Seeded {len(COEFFICIENTS)} methodology coefficients.")


if __name__ == "__main__":
    asyncio.run(seed())
