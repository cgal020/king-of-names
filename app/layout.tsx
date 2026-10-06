import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  applicationName: appConfig.name,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: appConfig.background.light },
    { media: "(prefers-color-scheme: dark)", color: appConfig.background.dark },
  ],
};

// Brand colours come from lib/config.ts so they can be changed in one place.
const brandCss = `
:root { --brand: ${appConfig.accent.light}; --brand-background: ${appConfig.background.light}; }
@media (prefers-color-scheme: dark) {
  :root { --brand: ${appConfig.accent.dark}; --brand-background: ${appConfig.background.dark}; }
}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans antialiased", geist.variable)}>
      <head>
        <style>{brandCss}</style>
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
