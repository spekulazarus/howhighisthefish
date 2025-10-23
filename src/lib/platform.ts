/* Platform detection helpers for browser-specific capabilities */
/* eslint-disable no-restricted-globals */

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = (navigator.platform || "").toLowerCase();
  // iPadOS reports MacIntel but has touch points
  const nav = navigator as Navigator & { maxTouchPoints?: number };
  const iPadOS = platform.includes("mac") && (nav.maxTouchPoints ?? 0) > 1;
  return /iPhone|iPad|iPod/i.test(ua) || iPadOS;
}

export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const vendor = navigator.vendor || "";
  // Safari on iOS may include "Mobile/..." but not Chrome/CriOS/FxiOS/EdgiOS
  const safariLike = /Safari/i.test(ua) && !/(Chrome|CriOS|FxiOS|EdgiOS)/i.test(ua);
  const appleVendor = /Apple/i.test(vendor);
  return safariLike && appleVendor;
}

export function isIosSafari(): boolean {
  return isIOS() && isSafari();
}

/** Web Bluetooth capability flag */
export function supportsWebBluetooth(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { bluetooth?: unknown };
  return "bluetooth" in navigator && !!nav.bluetooth;
}

export function getPlatformInfo() {
  return {
    ios: isIOS(),
    safari: isSafari(),
    iosSafari: isIosSafari(),
    webBluetooth: supportsWebBluetooth(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}
