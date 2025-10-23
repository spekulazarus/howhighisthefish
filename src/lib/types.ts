export interface Reading {
  ts: number;           // timestamp (ms since epoch)
  distanceMm: number;   // raw distance from sensor in millimeters
  percent: number;      // converted water level in percent [0..100]
}

export interface ConnectResult {
  device: BluetoothDevice;
  disconnect: () => Promise<void>;
}

export type ReadingListener = (reading: Reading) => void;
