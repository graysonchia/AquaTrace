const TIER_STYLES: Record<
  string,
  { label: string; className: string; description: string }
> = {
  peer_reviewed: {
    label: "Peer-Reviewed",
    className: "border-emerald-300 bg-emerald-100 text-emerald-800",
    description: "Evidence published through peer-reviewed research.",
  },
  corporate_disclosure: {
    label: "Corporate Disclosure",
    className: "border-blue-300 bg-blue-100 text-blue-800",
    description: "A figure reported directly by the company.",
  },
  modeled_estimate: {
    label: "Modeled Estimate",
    className: "border-amber-300 bg-amber-100 text-amber-800",
    description: "A figure calculated from an analytical model.",
  },
  aggregator_estimate: {
    label: "Aggregator Estimate",
    className: "border-red-300 bg-red-100 text-red-800",
    description: "An estimate compiled by a third-party aggregator.",
  },
};

export function SourceTierBadge({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier] ?? {
    label: tier,
    className: "border-gray-300 bg-gray-100 text-gray-800",
    description: "Source quality has not been classified.",
  };

  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${style.className}`}
      title={style.description}
    >
      {style.label}
    </span>
  );
}
