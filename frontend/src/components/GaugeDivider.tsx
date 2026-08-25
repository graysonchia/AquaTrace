export function GaugeDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      {label && (
        <span className="font-mono text-[11px] uppercase tracking-widest text-river/70 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-well/15 relative">
        <div className="absolute inset-0 flex justify-between">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-px h-1.5 bg-well/25 -mt-0.5" />
          ))}
        </div>
      </div>
    </div>
  );
}
