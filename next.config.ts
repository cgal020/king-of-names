import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps the dev badge out of screenshots and client demos.
  devIndicators: false,
  // Dev only: lets a phone on the same Wi-Fi open the dev server by LAN address.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
