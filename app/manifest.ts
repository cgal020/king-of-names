import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: appConfig.name,
    short_name: appConfig.shortName,
    description: appConfig.description,
    start_url: "/capture",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: appConfig.splash,
    theme_color: appConfig.background.light,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press shortcuts on Android; iOS ignores them.
    shortcuts: [
      { name: "Record a note", short_name: "Record", url: "/capture?record=1", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Scan a card", short_name: "Scan card", url: "/capture/card", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Ask about your people", short_name: "Ask", url: "/ask", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
