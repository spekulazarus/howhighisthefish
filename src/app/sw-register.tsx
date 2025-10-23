"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[SW] Service workers are not supported in this browser.");
      }
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .then((reg) => {
          if (process.env.NODE_ENV !== "production") {
            console.info("[SW] registered:", reg.scope);
          }

          // Listen for updates to the service worker
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed") {
                // If there's a waiting worker, a new version is available
                if (navigator.serviceWorker.controller) {
                  console.info("[SW] New content is available; will be used on next load.");
                } else {
                  console.info("[SW] Content is cached for offline use.");
                }
              }
            });
          });
        })
        .catch((err) => {
          console.error("[SW] registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    // Optional: try to update SW when page becomes visible
    const onVisibility = () => {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update().catch(() => {}));
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
