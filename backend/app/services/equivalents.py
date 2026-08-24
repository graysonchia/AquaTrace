# Liters per unit. These are intentionally approximate, human-scale references.
EQUIVALENTS = {
    "showers": 65.0,
    "bottles_500ml": 0.5,
    "glasses_of_water": 0.25,
    "loads_of_laundry": 150.0,
    "toilet_flushes": 6.0,
}


def liters_to_equivalents(liters: float) -> dict[str, float]:
    """Convert a non-negative water volume into approximate everyday units."""
    if liters < 0:
        raise ValueError("liters must be non-negative")
    return {
        name: round(liters / liters_per_unit, 2)
        for name, liters_per_unit in EQUIVALENTS.items()
    }
