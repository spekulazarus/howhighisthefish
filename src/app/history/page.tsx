"use client";

import { useEffect, useMemo, useState } from "react";
import type { Reading } from "@/lib/types";
import { getReadingsInRange } from "@/lib/storage";
import LevelChart from "@/components/LevelChart";

type RangePreset = 1 | 6 | 24 | 168; // hours: 1h, 6h, 24h, 7d

export default function HistoryPage() {
  const [rangeHours, setRangeHours] = useState<RangePreset>(24);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const rangeLabel = useMemo(() => {
    switch (rangeHours) {
      case 1:
        return "Letzte 1 Stunde";
      case 6:
        return "Letzte 6 Stunden";
      case 24:
        return "Letzte 24 Stunden";
      case 168:
        return "Letzte 7 Tage";
      default:
        return `Letzte ${rangeHours} Stunden`;
    }
  }, [rangeHours]);

  useEffect(() => {
    let cancelled = false;
    const endTs = Date.now();
    const startTs = endTs - rangeHours * 60 * 60 * 1000;
    getReadingsInRange(startTs, endTs)
      .then((rows) => {
        if (!cancelled) setReadings(rows);
      })
      .catch(() => {
        if (!cancelled) setReadings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rangeHours]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col gap-8 py-12 px-6 bg-white dark:bg-black">
        <header className="w-full">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Historischer Wasserstand
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Diese Ansicht ist offline verfügbar. Daten werden lokal in IndexedDB gespeichert.
          </p>
        </header>

        <section className="w-full">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Zeitraum:</span>
            <div className="flex gap-2">
              {[1, 6, 24, 168].map((h) => (
                <button
                  key={h}
                  onClick={() => setRangeHours(h as RangePreset)}
                  className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                    rangeHours === h
                      ? "bg-sky-500 text-white border-sky-500"
                      : "border-zinc-300 dark:border-zinc-700 hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-zinc-50"
                  }`}
                >
                  {h === 168 ? "7 Tage" : `${h}h`}
                </button>
              ))}
            </div>
            <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">{rangeLabel}</span>
          </div>

          <div className="mt-6">
            {loading ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Lade Daten…</p>
            ) : readings.length > 0 ? (
              <LevelChart readings={readings} />
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Keine Daten im ausgewählten Zeitraum vorhanden.
              </p>
            )}
          </div>
        </section>

        <section className="w-full">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Hinweis: Live-Daten erfordern eine aktive Bluetooth-Verbindung. Historische Daten werden
            lokal gespeichert und sind offline abrufbar.
          </p>
        </section>
      </main>
    </div>
  );
}
