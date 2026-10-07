"use client";

import { useEffect } from "react";

// Registers the service worker in production builds only; in development it
// would cache stale code over hot reloads.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Not fatal: the app works without it, just not offline.
    });
  }, []);
  return null;
}
