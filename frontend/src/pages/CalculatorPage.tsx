import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "../api/endpoints";
import { GaugeDivider } from "../components/GaugeDivider";
import { SourceTierBadge } from "../components/SourceTierBadge";

const EQUIVALENT_LABELS: Record<string, { label: string; emoji: string }> = {
  showers: { label: "showers", emoji: "🚿" },
  bottles_500ml: { label: "500mL bottles of water", emoji: "🍾" },
  glasses_of_water: { label: "glasses of water", emoji: "🥛" },
  loads_of_laundry: { label: "loads of laundry", emoji: "🧺" },
  toilet_flushes: { label: "toilet flushes", emoji: "🚽" },
};

export function CalculatorPage() {
  const [monthlyQueries, setMonthlyQueries] = useState(500);
  const [methodology, setMethodology] = useState<string>();

  const methodologiesQuery = useQuery({
    queryKey: ["methodologies"],
    queryFn: api.getMethodologies,
  });
  const calculationMutation = useMutation({
    mutationFn: () => api.personalEstimate(monthlyQueries, methodology),
  });

  const result = calculationMutation.data;
  const inputIsValid =
    Number.isFinite(monthlyQueries) &&
    monthlyQueries > 0 &&
    monthlyQueries <= 1_000_000_000_000;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inputIsValid) calculationMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-river">
          Make the scale tangible
        </p>
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-well">
          Your Personal Footprint
        </h1>
        <p className="font-serif text-ink/70">
          Estimate your own AI usage&apos;s water footprint, translated into
          familiar everyday equivalents.
        </p>
      </div>

      <GaugeDivider label="Usage Inputs" />

      <section className="space-y-6 rounded-sm border border-well/15 bg-paper p-6">
        <form
          className="flex flex-col items-stretch gap-4 md:flex-row md:items-end"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 md:max-w-56">
            <label
              className="mb-1 block font-display text-sm font-medium text-well"
              htmlFor="monthly-queries"
            >
              Queries per month
            </label>
            <input
              className="w-full rounded-sm border border-well/25 px-3 py-2 font-mono text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-shallow/40"
              id="monthly-queries"
              max={1_000_000_000_000}
              min={1}
              onChange={(event) => setMonthlyQueries(event.target.valueAsNumber)}
              required
              type="number"
              value={Number.isNaN(monthlyQueries) ? "" : monthlyQueries}
            />
          </div>
          <div className="flex-1 md:max-w-sm">
            <label
              className="mb-1 block font-display text-sm font-medium text-well"
              htmlFor="personal-methodology"
            >
              Methodology
            </label>
            <select
              className="w-full rounded-sm border border-well/25 bg-paper px-3 py-2 font-mono text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-shallow/40 disabled:bg-shallow/20"
              disabled={methodologiesQuery.isLoading}
              id="personal-methodology"
              onChange={(event) => setMethodology(event.target.value || undefined)}
              value={methodology ?? ""}
            >
              <option value="">Average across all methodologies</option>
              {methodologiesQuery.data?.map((item) => (
                <option key={item.source_name} value={item.source_name}>
                  {item.source_name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="rounded-sm bg-river px-5 py-2 font-mono text-xs font-medium uppercase tracking-wide text-white transition hover:bg-well focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-river focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-well/25"
            disabled={!inputIsValid || calculationMutation.isPending}
            type="submit"
          >
            {calculationMutation.isPending ? "Calculating…" : "Calculate"}
          </button>
        </form>

        {methodologiesQuery.isError && (
          <p className="font-serif text-sm text-drought">
            Methodology choices could not be loaded. The average calculation is
            still available.
          </p>
        )}
        {calculationMutation.isError && (
          <div className="rounded-sm border border-drought/30 bg-drought/5 p-4 font-serif text-sm text-drought">
            Your footprint could not be calculated. Check that the API is running
            and try again.
          </div>
        )}

        {result && (
          <div>
            <GaugeDivider label="Monthly Footprint" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mt-5 font-mono text-5xl font-bold tracking-tight text-well">
                  {formatValue(result.total_liters)} liters
                </div>
                <div className="mt-1 font-serif text-sm text-ink/60">
                  per month, based on {result.methodology_used}
                </div>
              </div>
              <span className="shrink-0">
                <SourceTierBadge tier="modeled_estimate" />
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {Object.entries(result.equivalents).map(([key, value]) => {
                const meta = EQUIVALENT_LABELS[key] ?? {
                  label: key.replaceAll("_", " "),
                  emoji: "💧",
                };

                return (
                  <article
                    className="rounded-sm border border-well/10 bg-shallow/20 p-4 text-center"
                    key={key}
                  >
                    <div aria-hidden="true" className="mb-2 text-2xl">
                      {meta.emoji}
                    </div>
                    <div className="font-mono font-semibold text-well">
                      {formatValue(value)}
                    </div>
                    <div className="mt-1 font-serif text-xs leading-4 text-ink/60">
                      {meta.label}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <GaugeDivider label="Method Note" />

      <p className="font-serif text-xs leading-5 text-ink/60">
        This calculator multiplies usage by a published per-query coefficient.
        It is an illustrative estimate, not a measurement of your specific device,
        model, data center, or electricity supply.
      </p>
    </div>
  );
}

function formatValue(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
