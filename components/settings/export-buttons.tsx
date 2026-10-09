"use client";

import { toast } from "sonner";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportFileName, peopleToCsv, peopleToJson } from "@/lib/export/people";
import { exportPeople } from "@/app/actions/settings";

const FORMATS = [
  { format: "csv", label: "Export CSV", type: "text/csv" },
  { format: "json", label: "Export JSON", type: "application/json" },
] as const;

// Phones get the share sheet (Save to Files, email, AirDrop); a computer
// downloads the file.
async function deliver(file: File) {
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Fetches everyone fresh from the server, then builds the file on the phone.
export function ExportButtons() {
  async function exportAs({ format, type }: (typeof FORMATS)[number]) {
    let people;
    try {
      people = await exportPeople();
    } catch {
      toast.error("Couldn’t load your people. Check your connection and try again.");
      return;
    }
    const content = format === "csv" ? peopleToCsv(people) : peopleToJson(people);
    try {
      await deliver(new File([content], exportFileName(format), { type }));
      toast.success(`Exported ${people.length} people`);
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
      toast.error("Couldn’t create the export file");
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {FORMATS.map((option) => (
        <Button key={option.format} variant="outline" size="touch-lg" onClick={() => void exportAs(option)}>
          <DownloadIcon aria-hidden />
          {option.label}
        </Button>
      ))}
    </div>
  );
}
