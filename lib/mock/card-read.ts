// Mockup stand-in for the AI card reader. The real app sends the card photo
// to the extraction model and gets these fields back; here every card
// "reads" as the sample person in the pending draft.
import type { CardDetails } from "@/lib/cards/parse-qr";

export async function mockReadCard(): Promise<CardDetails> {
  await new Promise((resolve) => setTimeout(resolve, 1400));
  return {
    full_name: "Sofia Haddad",
    company: "Gulf Freight Partners",
    role: "Head of Partnerships",
    phones: ["+971555550142"],
    emails: ["sofia@gulffreight.example"],
    websites: ["https://gulffreight.example"],
    linkedin: null,
    line: null,
    digitalCard: null,
    address: "Jebel Ali Free Zone, Dubai",
    notes: null,
    birthday: null,
  };
}
