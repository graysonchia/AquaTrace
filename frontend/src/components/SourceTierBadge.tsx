const TIER_STYLES: Record<
  string,
  { label: string; abbr: string; className: string; description: string }
> = {
  peer_reviewed: {
    label: "Peer-Reviewed",
    abbr: "PR",
    className: "border-river text-river bg-shallow/30",
    description: "Evidence published through peer-reviewed research.",
  },
  corporate_disclosure: {
    label: "Corporate Disclosure",
    abbr: "CD",
    className: "border-well text-well bg-well/5",
    description: "A figure reported directly by the company.",
  },
  modeled_estimate: {
    label: "Modeled Estimate",
    abbr: "ME",
    className: "border-amber-600 text-amber-800 bg-amber-50",
    description: "A figure calculated from an analytical model.",
  },
  aggregator_estimate: {
    label: "Aggregator Estimate",
    abbr: "AE",
    className: "border-drought text-drought bg-drought/5",
    description: "An estimate compiled by a third-party aggregator.",
  },
};

export function SourceTierBadge({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier] ?? {
    label: tier,
    abbr: "??",
    className: "border-slate-400 text-slate-600 bg-slate-50",
    description: "Source quality has not been classified.",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 text-[11px] font-mono border rounded-sm ${style.className}`}
      title={`${style.label}: ${style.description}`}
    >
      <span className="font-semibold">{style.abbr}</span>
      <span className="opacity-40">·</span>
      <span className="uppercase tracking-wide">{style.label}</span>
    </span>
  );
}
