import Dexie, { Table } from "dexie";
import type { Reading } from "@/lib/types";

/**
 * IndexedDB storage via Dexie for offline access to readings.
 */
class WilliDB extends Dexie {
  // Table of readings: auto-increment id, indexed by timestamp
  readings!: Table<Reading, number>;

  constructor() {
    super("howhighisthefish-db");
    this.version(1).stores({
      // ++id: auto-increment primary key
      // ts: index for time-range queries
      readings: "++id, ts, distanceMm, percent",
    });
    this.readings = this.table<Reading, number>("readings");
  }
}

let dbInstance: WilliDB | null = null;
try {
  dbInstance = new WilliDB();
} catch (e) {
  // Safari Private Mode disables IndexedDB; fall back to in-memory store
  console.warn("[storage] IndexedDB unavailable; using in-memory history", e);
  dbInstance = null;
}
export const db = dbInstance;
const memoryReadings: Reading[] = [];

/**
 * Persist the latest reading to localStorage for quick offline retrieval.
 */
export function saveLatestReading(reading: Reading) {
  try {
    localStorage.setItem("latestReading", JSON.stringify(reading));
  } catch {
    // Ignore storage errors (e.g., Safari private mode)
  }
}

/**
 * Load the latest reading from localStorage.
 */
export function loadLatestReading(): Reading | null {
  try {
    const s = localStorage.getItem("latestReading");
    return s ? (JSON.parse(s) as Reading) : null;
  } catch {
    return null;
  }
}

/**
 * Append a reading to IndexedDB history.
 */
export async function appendHistory(reading: Reading): Promise<void> {
  if (db) {
    await db.readings.add(reading);
  } else {
    memoryReadings.push(reading);
  }
}

/**
 * Get recent readings (sorted by ts descending).
 */
export async function getRecentReadings(limit = 50): Promise<Reading[]> {
  if (db) {
    return db.readings.orderBy("ts").reverse().limit(limit).toArray();
  }
  const start = Math.max(0, memoryReadings.length - limit);
  return memoryReadings.slice(start).sort((a, b) => b.ts - a.ts);
}

/**
 * Get readings in a time range [start, end] inclusive, sorted by ts ascending.
 */
export async function getReadingsInRange(startTs: number, endTs: number): Promise<Reading[]> {
  if (db) {
    return db.readings.where("ts").between(startTs, endTs).sortBy("ts");
  }
  return memoryReadings
    .filter((r) => r.ts >= startTs && r.ts <= endTs)
    .sort((a, b) => a.ts - b.ts);
}
