import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QrEditor } from "@/components/qr/qr-editor";
import { ScreenHeader } from "@/components/screen-header";
import { appConfig } from "@/lib/config";
import { getAccount } from "@/lib/data/account";
import { getQrCode } from "@/lib/data/qr";

export const metadata: Metadata = { title: `Edit QR code · ${appConfig.name}` };

export default async function EditQrPage({ params }: PageProps<"/settings/qr/[id]">) {
  const { id } = await params;
  const [code, account] = await Promise.all([getQrCode(id), getAccount()]);
  if (!code) notFound();
  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader back={{ href: "/settings#qr", label: "Settings" }} showSettings={false} />
      <h1 className="type-heading mt-1 mb-6">Edit QR code</h1>
      <QrEditor code={code} me={{ name: account.displayName ?? "", email: account.email ?? "" }} />
    </main>
  );
}
