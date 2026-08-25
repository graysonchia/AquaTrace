import type { ReactNode } from "react";
import type {
  DefaultLegendContentProps,
  TooltipPayloadEntry,
  TooltipValueType,
} from "recharts";

type InstrumentTooltipProps = {
  active?: boolean;
  formatLabel?: (label: ReactNode) => ReactNode;
  formatValue?: (value: TooltipValueType | undefined) => ReactNode;
  label?: ReactNode;
  payload?: ReadonlyArray<TooltipPayloadEntry>;
};

export function InstrumentTooltip({
  active,
  formatLabel = (label) => label,
  formatValue = defaultValueFormatter,
  label,
  payload,
}: InstrumentTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-44 rounded-sm border border-well/20 bg-paper px-3 py-2 shadow-[0_8px_24px_rgba(11,49,66,0.12)]">
      {label !== undefined && (
        <p className="mb-2 border-b border-well/10 pb-1.5 font-serif text-xs text-ink/60">
          {formatLabel(label)}
        </p>
      )}
      <ul className="space-y-1.5">
        {payload.map((entry, index) => (
          <li
            className="grid grid-cols-[8px_1fr_auto] items-center gap-2"
            key={`${String(entry.dataKey)}-${index}`}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2"
              style={{ backgroundColor: entry.color ?? entry.fill ?? "#1C6E8C" }}
            />
            <span className="font-serif text-xs text-ink/60">
              {entry.name}
            </span>
            <span className="font-mono text-xs font-medium text-well">
              {formatValue(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InstrumentLegend({ payload }: DefaultLegendContentProps) {
  if (!payload?.length) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
      {payload.map((entry, index) => (
        <li
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-well/60"
          key={`${entry.value ?? "series"}-${index}`}
        >
          <span
            aria-hidden="true"
            className="h-2 w-2"
            style={{ backgroundColor: entry.color ?? "#1C6E8C" }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

function defaultValueFormatter(value: TooltipValueType | undefined) {
  if (Array.isArray(value)) return value.join("–");
  return value ?? "—";
}
