import { useQuery } from "@tanstack/react-query";

import { api } from "../api/endpoints";

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
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Water use on the ground
        </p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">
          Case Studies
        </h1>
        <p className="text-slate-600">
          Real, named, sourced examples—because aggregate statistics can obscure
          what this actually looks like for communities and watersheds.
        </p>
      </div>

      {caseStudies.length > 0 ? (
        <section
          aria-label="Sourced water-use case studies"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {caseStudies.map((caseStudy) => (
            <article
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              key={caseStudy.title}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                {caseStudy.region}
              </p>
              <h2 className="mb-3 text-lg font-semibold leading-6 text-slate-950">
                {caseStudy.title}
              </h2>
              <p className="flex-1 text-sm leading-6 text-slate-600">
                {caseStudy.narrative}
              </p>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-3 text-sm font-semibold leading-5 text-slate-800">
                  {caseStudy.key_stat}
                </p>
                <a
                  className="text-xs font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-700"
                  href={caseStudy.source_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Read the source
                </a>
              </div>
            </article>
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
  return (
    <div aria-busy="true" aria-label="Loading case studies" className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((card) => (
          <div
            className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"
            key={card}
          />
        ))}
      </div>
    </div>
  );
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
    </div>
  );
}
