import { clamp } from "@/lib/convert";

type Props = {
  percent: number;          // 0..100
  distanceMm?: number;      // optional raw value
  className?: string;
};

/**
 * Visual tank gauge: shows a container with a fill level based on percent.
 */
export default function TankGauge({ percent, distanceMm, className }: Props) {
  const pct = Math.round(clamp(percent, 0, 100));

  return (
    <div className={className}>
      <div className="mb-2 flex items-end gap-3">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">Wasserstand</h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {distanceMm != null ? `${distanceMm} mm` : "— mm"}
        </span>
      </div>

      <div
        className="relative h-64 w-40 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 overflow-hidden"
        role="img"
        aria-label={`Tankfüllstand ${pct} Prozent`}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 w-full transition-[height] duration-300 ease-out"
          style={{ height: `${pct}%` }}
        >
          <div className="h-full w-full bg-gradient-to-t from-sky-500 via-sky-400 to-sky-300 opacity-90" />
        </div>

        {/* Tick marks */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-zinc-200/60 dark:border-zinc-700/60"
              style={{ bottom: `${i * 10}%` }}
            />
          ))}
        </div>

        {/* Percent label */}
        <div className="absolute top-2 right-2 rounded-full bg-black/60 px-3 py-1 text-white text-sm">
          {pct}%
        </div>
      </div>
    </div>
  );
}
