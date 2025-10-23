"use client";

import { useEffect, useMemo, useState } from "react";
import bluetooth from "@/lib/bluetooth";
import type { Reading, ReadingListener } from "@/lib/types";
import { getPlatformInfo } from "@/lib/platform";

type Props = {
  onConnected?: (deviceName?: string) => void;
  onReading?: (reading: Reading) => void;
};

export default function BluetoothConnectButton({ onConnected, onReading }: Props) {
  const [supported, setSupported] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connectedName, setConnectedName] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState(getPlatformInfo());
  const { iosSafari } = platform;

  useEffect(() => {
    setSupported(bluetooth.isSupported());
  }, []);

  useEffect(() => {
    setPlatform(getPlatformInfo());
  }, []);

  // Hook listener to forward readings to parent
  const listener: ReadingListener = useMemo(
    () => (reading) => {
      onReading?.(reading);
    },
    [onReading]
  );

  useEffect(() => {
    bluetooth.addListener(listener);
    return () => bluetooth.removeListener(listener);
  }, [listener]);

  async function handleConnect() {
    setError(null);
    setConnecting(true);
    try {
      const res = await bluetooth.connect();
      const name = res.device.name ?? "ShellyBLU";
      setConnectedName(name);
      onConnected?.(name);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Verbindung fehlgeschlagen.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!supported && (
        iosSafari ? (
          <div className="text-sm text-amber-500">
            iPhone Safari unterstützt Web Bluetooth nicht.
            <div className="mt-1">
              Optionen:
              <ul className="list-disc pl-4 mt-1">
                <li>
                  Verwende einen kompatiblen Browser wie{" "}
                  <a
                    className="underline"
                    href="https://apps.apple.com/us/app/bluefy-web-ble-browser/id1500727283"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bluefy
                  </a>{" "}
                  oder{" "}
                  <a
                    className="underline"
                    href="https://apps.apple.com/us/app/webble/id1193531073"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WebBLE
                  </a>
                  , und rufe diese Seite dort auf.
                </li>
                <li>Oder starte die Demo unten, um die UI auszuprobieren.</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-500">
            Web Bluetooth wird von diesem Browser nicht unterstützt.
          </p>
        )
      )}
      {supported && !connectedName && (
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="rounded-full bg-sky-500 px-6 py-3 text-white font-medium hover:bg-sky-600 disabled:opacity-60"
        >
          {connecting ? "Verbinde…" : "Mit Sensor verbinden"}
        </button>
      )}
      {connectedName && (
        <div className="text-sm text-emerald-500">
          Verbunden mit: <span className="font-medium">{connectedName}</span>
        </div>
      )}
      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
}
