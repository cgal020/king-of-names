import type { Metadata } from "next";
import { QrViewer } from "@/components/qr/qr-viewer";
import { appConfig } from "@/lib/config";
import { listQrCodes } from "@/lib/data/qr";

export const metadata: Metadata = { title: `My QR · ${appConfig.name}` };

export default async function QrPage() {
  return <QrViewer codes={await listQrCodes()} />;
}
