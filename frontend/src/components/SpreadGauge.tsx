import { motion, useReducedMotion } from "framer-motion";

const CENTER_X = 160;
const CENTER_Y = 150;
const RADIUS = 120;
const TICK_COUNT = 25;

export function SpreadGauge({ value }: { value: number }) {
  const shouldReduceMotion = useReducedMotion();
  const gaugeMaximum = Math.max(200, Math.ceil(value / 50) * 50);
  const ratio = Math.min(Math.max(value / gaugeMaximum, 0), 1);
  const needleRotation = -90 + ratio * 180;

  return (
    <div className="mx-auto w-full max-w-sm" role="img" aria-label={`${value.toFixed(0)} times spread between the lowest and highest estimates`}>
      <div className="relative">
        <svg
          aria-hidden="true"
          className="h-auto w-full"
          viewBox="0 0 320 190"
        >
          <defs>
            <linearGradient id="spread-gauge-gradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#1C6E8C" />
              <stop offset="100%" stopColor="#C1440E" />
            </linearGradient>
          </defs>

          <path
            d="M 40 150 A 120 120 0 0 1 280 150"
            fill="none"
            opacity="0.12"
            stroke="#0B3142"
            strokeLinecap="square"
            strokeWidth="9"
          />
          <path
            d="M 40 150 A 120 120 0 0 1 280 150"
            fill="none"
            stroke="url(#spread-gauge-gradient)"
            strokeLinecap="square"
            strokeWidth="7"
          />

          {Array.from({ length: TICK_COUNT }).map((_, index) => {
            const angle = Math.PI + (Math.PI * index) / (TICK_COUNT - 1);
            const isMajor = index % 4 === 0;
            const innerRadius = RADIUS - (isMajor ? 17 : 12);

            return (
              <line
                key={index}
                opacity={isMajor ? 0.55 : 0.28}
                stroke="#0B3142"
                strokeWidth={isMajor ? 1.5 : 1}
                x1={CENTER_X + innerRadius * Math.cos(angle)}
                x2={CENTER_X + RADIUS * Math.cos(angle)}
                y1={CENTER_Y + innerRadius * Math.sin(angle)}
                y2={CENTER_Y + RADIUS * Math.sin(angle)}
              />
            );
          })}

          <text
            fill="#0B3142"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="9"
            opacity="0.45"
            textAnchor="middle"
            x="40"
            y="171"
          >
            0×
          </text>
          <text
            fill="#0B3142"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="9"
            opacity="0.45"
            textAnchor="middle"
            x="280"
            y="171"
          >
            {gaugeMaximum}×
          </text>

          <motion.g
            animate={{ rotate: needleRotation }}
            initial={{ rotate: shouldReduceMotion ? needleRotation : -90 }}
            style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <line
              stroke="#0B3142"
              strokeLinecap="square"
              strokeWidth="3"
              x1={CENTER_X}
              x2={CENTER_X}
              y1={CENTER_Y + 7}
              y2="48"
            />
          </motion.g>
          <circle cx={CENTER_X} cy={CENTER_Y} fill="#A6D8D4" r="8" />
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            fill="none"
            opacity="0.85"
            r="8"
            stroke="#0B3142"
            strokeWidth="2"
          />
        </svg>

        <p className="absolute inset-x-0 bottom-0 text-center font-mono text-5xl font-bold tracking-tight text-drought">
          {value.toFixed(0)}×
        </p>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-well/45">
        Published estimate spread
      </p>
    </div>
  );
}
