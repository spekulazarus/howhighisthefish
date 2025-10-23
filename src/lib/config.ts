/**
 * Configuration for Shelly BLU Distance connection and tank geometry.
 * IMPORTANT: Replace the placeholder UUIDs with the correct Service/Characteristic UUIDs
 * for the Shelly BLU Distance sensor to enable notifications/reads.
 */
export const DEVICE_NAME_PREFIX = "ShellyBLU";

/**
 * BLE GATT UUIDs
 * Replace the placeholders with the actual UUIDs from the device documentation.
 * Example format: "0000181a-0000-1000-8000-00805f9b34fb"
 */
export const BLE_SERVICE_UUID = "0000xxxx-0000-1000-8000-00805f9b34fb"; // TODO: set real service UUID
export const BLE_CHARACTERISTIC_UUID = "0000xxxx-0000-1000-8000-00805f9b34fb"; // TODO: set real characteristic UUID

/**
 * Tank geometry (in millimeters). Adjust to your tank setup.
 * minDistanceMm: distance at FULL tank (sensor-to-surface smallest distance).
 * maxDistanceMm: distance at EMPTY tank (sensor-to-surface largest distance).
 */
export const TANK_MIN_DISTANCE_MM = 100;   // TODO: set measured min (full)
export const TANK_MAX_DISTANCE_MM = 1000;  // TODO: set measured max (empty)

/**
 * Sampling configuration
 */
export const SAMPLE_DEBOUNCE_MS = 200; // throttle UI updates
