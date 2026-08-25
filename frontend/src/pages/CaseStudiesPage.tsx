import { useQuery } from "@tanstack/react-query";

import { api } from "../api/endpoints";
import { GaugeDivider } from "../components/GaugeDivider";
import { InstrumentLoading } from "../components/InstrumentLoading";
import { RevealCard } from "../components/RevealCard";

export function CaseStudiesPage() {
  const caseStudiesQuery = useQuery({
    queryKey: ["case-studies"],
    queryFn: api.getCaseStudies,
  });

  if (caseStudiesQuery.isLoading) {
    return <CaseStudiesLoadingState />;
  }

  if (caseStudiesQuery.isError) {
    return (
      <PageMessage
        title="Case studies could not be loaded"
        message="Check that the AquaTrace API and database are running, then refresh this page."
      />
    );
  }

  const caseStudies = caseStudiesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-river">
          Water use on the ground
        </p>
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-well">
          Case Studies
        </h1>
        <p className="font-serif text-ink/70">
          Real, named, sourced examples—because aggregate statistics can obscure
          what this actually looks like for communities and watersheds.
        </p>
      </div>

      <GaugeDivider label="Field Evidence" />

      {caseStudies.length > 0 ? (
        <section
          aria-label="Sourced water-use case studies"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {caseStudies.map((caseStudy, index) => (
            <RevealCard
              className="flex flex-col rounded-sm border border-well/15 bg-paper p-6"
              index={index}
              key={caseStudy.title}
            >
              <p className="mb-2 font-mono text-xs font-medium uppercase tracking-wide text-river">
                {caseStudy.region}
              </p>
              <h2 className="mb-3 font-display text-lg font-bold leading-6 text-well">
                {caseStudy.title}
              </h2>
              <p className="flex-1 font-serif text-sm leading-6 text-ink/70">
                {caseStudy.narrative}
              </p>
              <div className="mt-5">
                <GaugeDivider />
                <p className="mb-3 mt-4 font-mono text-sm font-semibold leading-5 text-ink">
                  {caseStudy.key_stat}
                </p>
                <a
                  className="font-mono text-xs font-medium uppercase tracking-wide text-river underline decoration-shallow underline-offset-4 hover:text-well"
                  href={caseStudy.source_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Read the source
                </a>
              </div>
            </RevealCard>
          ))}
        </section>
      ) : (
        <PageMessage
          title="No case studies are available"
          message="The API returned an empty case-study collection."
        />
      )}
    </div>
  );
}

function CaseStudiesLoadingState() {
  return <InstrumentLoading className="rounded-sm border border-well/15" />;
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-sm border border-well/15 bg-paper p-6">
      <h1 className="font-display font-bold text-well">{title}</h1>
      <p className="mt-1 font-serif text-sm text-ink/70">{message}</p>
    </div>
  );
}
