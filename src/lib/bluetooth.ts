/* eslint-disable no-console */
import {
  DEVICE_NAME_PREFIX,
  BLE_SERVICE_UUID,
  BLE_CHARACTERISTIC_UUID,
  TANK_MIN_DISTANCE_MM,
  TANK_MAX_DISTANCE_MM,
  SAMPLE_DEBOUNCE_MS,
} from "@/lib/config";
import { convertDistanceToPercent } from "@/lib/convert";
import { appendHistory, saveLatestReading } from "@/lib/storage";
import type { Reading, ReadingListener, ConnectResult } from "@/lib/types";

/** Validate UUID strings/aliases for Web Bluetooth APIs */
function isValidUuid(u: string | undefined | null): boolean {
  if (!u) return false;
  const s = String(u).trim();
  if (/^0x[0-9a-fA-F]{4}$/.test(s)) return true; // 16-bit alias
  // 128-bit UUID (lowercase hex)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s);
}

/**
 * Web Bluetooth service for Shelly BLU Distance sensor.
 * NOTE: You must set the correct BLE_SERVICE_UUID and BLE_CHARACTERISTIC_UUID in config.ts.
 */
class BluetoothService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private listeners = new Set<ReadingListener>();
  private pollTimer: number | null = null;
  private lastEmitTs = 0;

  isSupported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.bluetooth;
  }

  /**
   * Subscribe to live readings.
   */
  addListener(fn: ReadingListener) {
    this.listeners.add(fn);
  }

  removeListener(fn: ReadingListener) {
    this.listeners.delete(fn);
  }

  private async emitReading(distanceMm: number) {
    const now = Date.now();
    if (now - this.lastEmitTs < SAMPLE_DEBOUNCE_MS) {
      return;
    }
    this.lastEmitTs = now;

    const percent = convertDistanceToPercent(distanceMm, TANK_MIN_DISTANCE_MM, TANK_MAX_DISTANCE_MM);
    const reading: Reading = { ts: now, distanceMm, percent };

    // Persist
    saveLatestReading(reading);
    appendHistory(reading).catch(() => {});

    // Notify listeners
    this.listeners.forEach((fn) => {
      try {
        fn(reading);
      } catch (e) {
        console.warn("[BT] listener error", e);
      }
    });
  }

  /**
   * Attempt to parse a distance in millimeters from a characteristic DataView.
   * The exact binary layout depends on the device firmware.
   * Current heuristic: read unsigned 16-bit little-endian at offset 0.
   */
  parseDistanceFromDataView(dv: DataView): number {
    // Common BLE sensor formats often place the primary value at the start.
    // Adjust this to match Shelly BLU's spec once confirmed.
    try {
      const mm = dv.getUint16(0, true);
      return mm;
    } catch {
      // Fallback: try Big Endian
      try {
        const mm = dv.getUint16(0, false);
        return mm;
      } catch {
        console.warn("[BT] Unable to parse distance from DataView; returning NaN");
        return NaN;
      }
    }
  }

  /**
   * Connect to the Shelly BLU device and start receiving readings.
   */
  async connect(): Promise<ConnectResult> {
    if (!this.isSupported()) {
      throw new Error("Web Bluetooth not supported in this browser/context.");
    }
    // Ensure UUIDs are configured
    if (!BLE_SERVICE_UUID || !BLE_CHARACTERISTIC_UUID || BLE_SERVICE_UUID.includes("xxxx")) {
      console.warn("[BT] Placeholder UUIDs detected. Please set real UUIDs in config.ts.");
    }

    const options: RequestDeviceOptions = {
      filters: [{ namePrefix: DEVICE_NAME_PREFIX }],
    };
    if (isValidUuid(BLE_SERVICE_UUID)) {
      options.optionalServices = [BLE_SERVICE_UUID as BluetoothServiceUUID];
    } else {
      console.warn(
        "[BT] BLE_SERVICE_UUID is not a valid UUID; proceeding without optionalServices. Set real UUIDs in config.ts for data."
      );
    }
    const device = await navigator.bluetooth.requestDevice(options);

    const server = await device.gatt!.connect();
    this.device = device;

    if (isValidUuid(BLE_SERVICE_UUID) && isValidUuid(BLE_CHARACTERISTIC_UUID)) {
      const service = await server.getPrimaryService(BLE_SERVICE_UUID as BluetoothServiceUUID);
      const characteristic = await service.getCharacteristic(
        BLE_CHARACTERISTIC_UUID as BluetoothCharacteristicUUID
      );
      this.characteristic = characteristic;

      // Prefer notifications if available
      const props = characteristic.properties;
      if (props.notify || props.indicate) {
        await characteristic.startNotifications();
        characteristic.addEventListener("characteristicvaluechanged", (ev: Event) => {
          const ch = ev.target as BluetoothRemoteGATTCharacteristic;
          const dv = ch.value!;
          const distanceMm = this.parseDistanceFromDataView(dv);
          if (isFinite(distanceMm)) {
            this.emitReading(distanceMm);
          }
        });
        console.info("[BT] Notifications started.");
      } else {
        // Fallback: poll readValue
        console.info("[BT] Notifications not supported; falling back to polling.");
        const poll = async () => {
          if (!this.characteristic) return;
          try {
            const dv = await this.characteristic.readValue();
            const distanceMm = this.parseDistanceFromDataView(dv);
            if (isFinite(distanceMm)) {
              this.emitReading(distanceMm);
            }
          } catch (e) {
            console.warn("[BT] Polling read failed:", e);
          }
        };
        poll(); // immediate
        this.pollTimer = window.setInterval(poll, Math.max(SAMPLE_DEBOUNCE_MS, 1000));
      }
    } else {
      console.warn(
        "[BT] Not starting data stream: set valid BLE_SERVICE_UUID and BLE_CHARACTERISTIC_UUID in config.ts."
      );
    }

    // Handle disconnection
    const onDisconnect = async () => {
      console.info("[BT] Device disconnected.");
      device.removeEventListener("gattserverdisconnected", onDisconnect as EventListener);
      await this.cleanup();
    };
    device.addEventListener("gattserverdisconnected", onDisconnect as EventListener);

    return {
      device,
      disconnect: async () => {
        device.removeEventListener("gattserverdisconnected", onDisconnect as EventListener);
        await this.cleanup();
      },
    };
  }

  private async cleanup() {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.characteristic) {
      try {
        // Stop notifications if they were started
        await this.characteristic.stopNotifications();
      } catch {
        // ignore
      }
      try {
        this.characteristic.removeEventListener("characteristicvaluechanged", () => {});
      } catch {
        // ignore
      }
    }
    if (this.device?.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch {
        // ignore
      }
    }
    this.characteristic = null;
    this.device = null;
  }
}

export const bluetooth = new BluetoothService();
export default bluetooth;
