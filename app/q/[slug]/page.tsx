import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { GlobeIcon, MailIcon, PhoneIcon, UserPlusIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { countScan, findQrBySlug } from "@/lib/data/qr";
import { destinationUrl } from "@/lib/qr/codes";
import { cn } from "@/lib/utils";

// Where a QR code lands. Public: anyone who scans a code can open it. Every
// purpose but a contact card goes straight on to its destination; a contact
// card is a small page with the details and a Save contact button.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/q/[slug]">): Promise<Metadata> {
  const code = await findQrBySlug((await params).slug);
  const name = code?.destination.purpose === "contact" ? code.destination.full_name : null;
  // Not indexed: these pages are for the person who scanned the code.
  return { title: name ?? (code ? "Contact" : "Code not found"), robots: { index: false, follow: false } };
}

export default async function QrLanding({ params }: PageProps<"/q/[slug]">) {
  const { slug } = await params;
  const code = await findQrBySlug(slug);
  if (!code) notFound();
  await countScan(slug).catch(() => {});

  const d = code.destination;
  if (d.purpose !== "contact") redirect(destinationUrl(d)!);

  const work = [d.role, d.company].filter(Boolean).join(", ");
  const action = cn(buttonVariants({ variant: "outline", size: "touch-lg" }), "w-full justify-start gap-3");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <p className="type-section">Contact</p>
      <h1 className="type-name mt-2">
        <bdi dir="auto">{d.full_name}</bdi>
      </h1>
      {work && <p className="mt-1 text-[1.0625rem]">{work}</p>}
      <a href={`/q/${slug}/contact.vcf`} className={cn(buttonVariants({ size: "touch-lg" }), "mt-8 w-full gap-2")}>
        <UserPlusIcon aria-hidden />
        Save contact
      </a>
      <div className="mt-3 grid gap-2">
        {d.phone && (
          <a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`} className={action}>
            <PhoneIcon aria-hidden className="text-primary" />
            <span className="tabular-nums">{d.phone}</span>
          </a>
        )}
        {d.email && (
          <a href={`mailto:${d.email}`} className={action}>
            <MailIcon aria-hidden className="text-primary" />
            <span className="truncate">{d.email}</span>
          </a>
        )}
        {d.website && (
          <a href={d.website} rel="noopener noreferrer" className={action}>
            <GlobeIcon aria-hidden className="text-primary" />
            <span className="truncate">{d.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          </a>
        )}
      </div>
    </main>
  );
}
