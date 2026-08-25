import { motion, useReducedMotion } from "framer-motion";

export function InstrumentLoading({
  className = "min-h-40",
}: {
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-live="polite"
      className={`flex items-center justify-center ${className}`}
      role="status"
    >
      <div className="inline-flex items-center gap-3">
        <motion.span
          aria-hidden="true"
          animate={
            shouldReduceMotion
              ? undefined
              : { opacity: [0.25, 1, 0.25], scaleY: [0.6, 1, 0.6] }
          }
          className="block h-4 w-px origin-center bg-river"
          transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
        />
        <span className="font-mono text-xs uppercase tracking-widest text-ink/40">
          Calibrating…
        </span>
      </div>
    </div>
  );
}
