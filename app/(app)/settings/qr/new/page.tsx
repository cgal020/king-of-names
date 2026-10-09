import type { Metadata } from "next";
import { QrEditor } from "@/components/qr/qr-editor";
import { ScreenHeader } from "@/components/screen-header";
import { appConfig } from "@/lib/config";
import { getAccount } from "@/lib/data/account";

export const metadata: Metadata = { title: `New QR code · ${appConfig.name}` };

export default async function NewQrPage() {
  const account = await getAccount();
  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader back={{ href: "/settings#qr", label: "Settings" }} showSettings={false} />
      <h1 className="type-heading mt-1 mb-6">New QR code</h1>
      <QrEditor code={null} me={{ name: account.displayName ?? "", email: account.email ?? "" }} />
    </main>
  );
}
