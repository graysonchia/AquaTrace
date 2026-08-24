import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { api } from "../api/endpoints";
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
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Make the scale tangible
        </p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">
          Your Personal Footprint
        </h1>
        <p className="text-slate-600">
          Estimate your own AI usage&apos;s water footprint, translated into
          familiar everyday equivalents.
        </p>
      </div>

      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          className="flex flex-col items-stretch gap-4 md:flex-row md:items-end"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 md:max-w-56">
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="monthly-queries"
            >
              Queries per month
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="personal-methodology"
            >
              Methodology
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
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
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!inputIsValid || calculationMutation.isPending}
            type="submit"
          >
            {calculationMutation.isPending ? "Calculating…" : "Calculate"}
          </button>
        </form>

        {methodologiesQuery.isError && (
          <p className="text-sm text-amber-700">
            Methodology choices could not be loaded. The average calculation is
            still available.
          </p>
        )}
        {calculationMutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Your footprint could not be calculated. Check that the API is running
            and try again.
          </div>
        )}

        {result && (
          <div className="border-t border-slate-100 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-4xl font-bold tracking-tight text-slate-950">
                  {formatValue(result.total_liters)} liters
                </div>
                <div className="mt-1 text-sm text-slate-500">
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
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center"
                    key={key}
                  >
                    <div aria-hidden="true" className="mb-2 text-2xl">
                      {meta.emoji}
                    </div>
                    <div className="font-semibold text-slate-950">
                      {formatValue(value)}
                    </div>
                    <div className="mt-1 text-xs leading-4 text-slate-500">
                      {meta.label}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
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
