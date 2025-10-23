"use client";

import { useEffect, useState } from "react";
import type { Reading } from "@/lib/types";
import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import TankGauge from "@/components/TankGauge";
import LevelChart from "@/components/LevelChart";
import { loadLatestReading, getRecentReadings } from "@/lib/storage";
import { DemoStream, seedHistory } from "@/lib/demo";

export default function Home() {
  const [deviceName, setDeviceName] = useState<string | undefined>();
  const [latest, setLatest] = useState<Reading | null>(() => loadLatestReading());
  const [recent, setRecent] = useState<Reading[]>([]);
  const [demo, setDemo] = useState<DemoStream | null>(null);
  const [demoRunning, setDemoRunning] = useState<boolean>(false);

  useEffect(() => {

    // Load recent history for chart
    getRecentReadings(120).then(setRecent).catch(() => {});
  }, []);

  // Stop demo when leaving the page
  useEffect(() => {
    return () => {
      demo?.stop();
    };
  }, [demo]);

  function handleReading(r: Reading) {
    setLatest(r);
    setRecent((prev) => {
      const next = [...prev, r];
      // limit size
      if (next.length > 240) next.shift();
      return next;
    });
  }

  async function startDemo() {
    if (demoRunning) return;
    await seedHistory(6, 12);
    const ds = new DemoStream();
    setDemo(ds);
    setDeviceName("Demo");
    ds.start(handleReading, { intervalMs: 1000 });
    setDemoRunning(true);
  }

  function stopDemo() {
    demo?.stop();
    setDemoRunning(false);
    setDemo(null);
    setDeviceName(undefined);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 py-12 px-6 bg-white dark:bg-black sm:items-start">
        <header className="w-full flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Willi Wasserstand
          </h1>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {deviceName ? (
              <>
                Verbunden mit <span className="font-medium">{deviceName}</span>
              </>
            ) : (
              "Nicht verbunden"
            )}
          </div>
        </header>

        <section className="w-full flex flex-col md:flex-row gap-10">
          <div className="flex-1">
            <BluetoothConnectButton
              onConnected={(name) => setDeviceName(name)}
              onReading={handleReading}
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={startDemo}
                disabled={demoRunning}
                className="rounded-full px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] disabled:opacity-60"
              >
                Demo starten
              </button>
              <button
                type="button"
                onClick={stopDemo}
                disabled={!demoRunning}
                className="rounded-full px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] disabled:opacity-60"
              >
                Demo stoppen
              </button>
            </div>
            <div className="mt-6">
              <TankGauge
                percent={latest?.percent ?? 0}
                distanceMm={latest?.distanceMm}
              />
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-2">
              Verlauf (live)
            </h2>
            {recent.length > 0 ? (
              <LevelChart readings={recent} />
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Noch keine Daten vorhanden. Verbinde den Sensor, um Live-Daten zu empfangen.
              </p>
            )}
          </div>
        </section>

        <section className="w-full">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Diese Anwendung unterstützt Offline-Modus. Letzte bekannte Werte werden lokal gespeichert
            und können ohne Internetverbindung angezeigt werden. Für Live-Daten ist eine aktive
            Bluetooth-Verbindung erforderlich.
          </p>
        </section>
      </main>
    </div>
  );
}
