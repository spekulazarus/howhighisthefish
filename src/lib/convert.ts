/**
 * Utilities to convert raw distance readings (in millimeters) to tank fill percentage.
 * Assumptions:
 * - Distances are measured from the sensor to the liquid surface.
 * - Smaller distance = fuller tank; larger distance = emptier tank.
 */

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Validate that geometry values are sane.
 * Throws descriptive errors if invalid.
 */
export function validateGeometry(minDistanceMm: number, maxDistanceMm: number) {
  if (!isFinite(minDistanceMm) || !isFinite(maxDistanceMm)) {
    throw new Error("Tank geometry must be finite numbers.");
  }
  if (minDistanceMm <= 0 || maxDistanceMm <= 0) {
    throw new Error("Tank geometry must be positive numbers (millimeters).");
  }
  if (minDistanceMm >= maxDistanceMm) {
    throw new Error(
      "minDistanceMm must be less than maxDistanceMm. Typically: min=FULL (smaller), max=EMPTY (larger)."
    );
  }
}

/**
 * Convert a measured distance (mm) to percentage [0..100].
 * 0% = empty (distance >= max), 100% = full (distance <= min).
 */
export function convertDistanceToPercent(
  distanceMm: number,
  minDistanceMm: number,
  maxDistanceMm: number
): number {
  validateGeometry(minDistanceMm, maxDistanceMm);

  // Normalize: smaller distance => higher percent
  const span = maxDistanceMm - minDistanceMm;
  const raw = ((maxDistanceMm - distanceMm) / span) * 100;
  return clamp(raw, 0, 100);
}

/**
 * Optionally smooth noisy readings using simple EMA.
 * alpha in (0,1]; smaller alpha => heavier smoothing.
 */
export function ema(prev: number | undefined, next: number, alpha = 0.3) {
  if (prev === undefined) return next;
  return alpha * next + (1 - alpha) * prev;
}
