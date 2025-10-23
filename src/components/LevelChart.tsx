"use client";

import { useMemo } from "react";
import type { Reading } from "@/lib/types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { TooltipItem } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Props = {
  readings: Reading[]; // assumed sorted ascending by ts or any order; will be sorted here
  className?: string;
  maxPoints?: number; // limit points shown
};

export default function LevelChart({ readings, className, maxPoints = 120 }: Props) {
  const { labels, dataPoints } = useMemo(() => {
    const sorted = [...readings].sort((a, b) => a.ts - b.ts);
    const limited = sorted.slice(Math.max(0, sorted.length - maxPoints));
    const lbls = limited.map((r) =>
      new Date(r.ts).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
    const pts = limited.map((r) => Number.isFinite(r.percent) ? r.percent : null);
    return { labels: lbls, dataPoints: pts };
  }, [readings, maxPoints]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Füllstand (%)",
          data: dataPoints,
          borderColor: "rgb(14, 165, 233)",
          backgroundColor: "rgba(14, 165, 233, 0.25)",
          tension: 0.25,
          fill: true,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }),
    [labels, dataPoints]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false as const,
      animation: { duration: 150 },
      scales: {
        x: {
          ticks: { color: "#a1a1aa" },
          grid: { color: "rgba(161,161,170,0.15)" },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: "#a1a1aa", stepSize: 20 },
          grid: { color: "rgba(161,161,170,0.15)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          callbacks: {
            label: (ctx: TooltipItem<"line">) => {
              const y = ctx.parsed?.y as number | null;
              const val = typeof y === "number" ? y : ctx.parsed?.y;
              return ` ${typeof val === "number" ? val.toFixed(1) : val}%`;
            },
          },
        },
      },
    }),
    []
  );

  return (
    <div className={className} style={{ height: 240 }}>
      <Line data={data} options={options} />
    </div>
  );
}
