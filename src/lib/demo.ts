/* eslint-disable no-console */
import {
  TANK_MIN_DISTANCE_MM,
  TANK_MAX_DISTANCE_MM,
  SAMPLE_DEBOUNCE_MS,
} from "@/lib/config";
import { convertDistanceToPercent } from "@/lib/convert";
import { saveLatestReading, appendHistory } from "@/lib/storage";
import type { Reading } from "@/lib/types";

/**
 * Simple demo stream that synthesizes readings to exercise the UI without hardware.
 * Generates an oscillating distance between tank min/max with minor noise.
 */
export class DemoStream {
  private timerId: number | null = null;
  private t = 0;
  private readonly min: number;
  private readonly max: number;

  constructor(min = TANK_MIN_DISTANCE_MM, max = TANK_MAX_DISTANCE_MM) {
    this.min = Math.min(min, max);
    this.max = Math.max(min, max);
  }

  start(onReading: (reading: Reading) => void, opts?: { intervalMs?: number }) {
    if (this.timerId !== null) return; // already running
    const intervalMs = Math.max(opts?.intervalMs ?? 1000, SAMPLE_DEBOUNCE_MS, 250);

    this.timerId = window.setInterval(() => {
      this.t += 1;

      const range = this.max - this.min;
      const mid = this.min + range / 2;
      const amp = range / 2 * 0.9; // stay within bounds
      const noise = (Math.random() - 0.5) * (range * 0.02); // ±2% noise
      const distanceMm = Math.max(
        this.min,
        Math.min(this.max, mid + Math.sin(this.t / 10) * amp + noise)
      );

      const percent = convertDistanceToPercent(distanceMm, this.min, this.max);
      const reading: Reading = { ts: Date.now(), distanceMm, percent };

      // Persist similar to real stream
      saveLatestReading(reading);
      appendHistory(reading).catch(() => {});

      // Emit
      try {
        onReading(reading);
      } catch (e) {
        console.warn("[Demo] listener error", e);
      }
    }, intervalMs);
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * Seed IndexedDB with synthetic historical readings so charts have data offline.
 * @param hours Number of hours of history to generate (default 6)
 * @param samplesPerHour Samples per hour (default 12 -> every 5 minutes)
 */
export async function seedHistory(hours = 6, samplesPerHour = 12) {
  const total = Math.max(1, Math.floor(hours * samplesPerHour));
  const stepMs = Math.floor((60 * 60 * 1000) / samplesPerHour);
  const now = Date.now();

  for (let i = total; i >= 1; i--) {
    const ts = now - i * stepMs;

    // reuse the same oscillation pattern based on i
    const min = TANK_MIN_DISTANCE_MM;
    const max = TANK_MAX_DISTANCE_MM;
    const range = Math.max(1, max - min);
    const mid = min + range / 2;
    const amp = range / 2 * 0.9;
    const noise = (Math.random() - 0.5) * (range * 0.02);

    const distanceMm = Math.max(
      min,
      Math.min(max, mid + Math.sin(i / 10) * amp + noise)
    );
    const percent = convertDistanceToPercent(distanceMm, min, max);
    const reading: Reading = { ts, distanceMm, percent };

    try {
      // Only seed history (do not overwrite latest for past samples)
      await appendHistory(reading);
    } catch {
      // ignore individual failures
    }
  }
}
