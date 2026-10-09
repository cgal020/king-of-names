"use client";

import { useMemo } from "react";
import QRCode from "qrcode";
import { BriefcaseBusinessIcon, CameraIcon, ContactRoundIcon, LinkIcon, MessageCircleIcon } from "lucide-react";
import { PURPOSE_META, type QrPurpose } from "@/lib/qr/codes";
import { cn } from "@/lib/utils";

// Each purpose's mark: an icon and an accent, used on the finder corners and
// the label. Generic icons rather than other companies' logos.
export const PURPOSE_STYLE: Record<QrPurpose, { icon: typeof LinkIcon; accent: string }> = {
  contact: { icon: ContactRoundIcon, accent: "#1f4d3d" },
  whatsapp: { icon: MessageCircleIcon, accent: "#1e7a55" },
  linkedin: { icon: BriefcaseBusinessIcon, accent: "#0a5bb0" },
  instagram: { icon: CameraIcon, accent: "#a8306f" },
  link: { icon: LinkIcon, accent: "#7a5a1f" },
};

// Always ink on ivory, even in dark mode: phone cameras read dark-on-light
// codes most reliably.
const INK = "#1d2a24";
const PAPER = "#fffaf0";
const GOLD = "#b48f4c";

// A QR code in the King of Names style: rounded modules in ink, finder
// corners in the purpose's accent, and the gold crown in the middle. High
// error correction keeps it readable with the crown covering the centre.
export function DesignedQr({
  value,
  purpose,
  size = 280,
  className,
}: {
  value: string;
  purpose: QrPurpose;
  size?: number;
  className?: string;
}) {
  const { count, cells } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "H" });
    const n = qr.modules.size;
    const dark: [number, number][] = [];
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) if (qr.modules.get(row, col)) dark.push([row, col]);
    return { count: n, cells: dark };
  }, [value]);

  const accent = PURPOSE_STYLE[purpose].accent;
  const quiet = 2;
  const box = count + quiet * 2;
  // The three 7x7 finder squares are drawn whole, so skip their modules.
  const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);
  // A clear patch in the middle for the crown, about a fifth of the code.
  const hole = Math.round(count * 0.22) | 1;
  const start = (count - hole) / 2;
  const inHole = (r: number, c: number) => r >= start - 0.5 && r < start + hole && c >= start - 0.5 && c < start + hole;
  const finders = [
    [0, 0],
    [0, count - 7],
    [count - 7, 0],
  ];

  return (
    <svg
      viewBox={`${-quiet} ${-quiet} ${box} ${box}`}
      width={size}
      height={size}
      role="img"
      aria-label={`QR code: ${PURPOSE_META[purpose].name}`}
      className={cn("block rounded-[8%]", className)}
      style={{ background: PAPER }}
    >
      {cells
        .filter(([r, c]) => !inFinder(r, c) && !inHole(r, c))
        .map(([r, c]) => (
          <rect key={`${r}-${c}`} x={c + 0.06} y={r + 0.06} width={0.88} height={0.88} rx={0.3} fill={INK} />
        ))}
      {finders.map(([r, c]) => (
        <g key={`${r}-${c}`}>
          <rect x={c + 0.5} y={r + 0.5} width={6} height={6} rx={1.6} fill="none" stroke={INK} strokeWidth={1} />
          <rect x={c + 2} y={r + 2} width={3} height={3} rx={0.9} fill={accent} />
        </g>
      ))}
      <g transform={`translate(${start} ${start})`}>
        <rect width={hole} height={hole} rx={hole * 0.22} fill={PAPER} />
        <g transform={`translate(${hole * 0.18} ${hole * 0.22}) scale(${(hole * 0.64) / 30})`}>
          <path d="M2 18 L4 5 L10 11 L15 2 L20 11 L26 5 L28 18 Z" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

// The purpose's mark for labels and lists: its icon in its accent.
export function PurposeMark({ purpose, className }: { purpose: QrPurpose; className?: string }) {
  const { icon: Icon, accent } = PURPOSE_STYLE[purpose];
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--mark)_14%,transparent)] text-(--mark)",
        // Lighter on the dark theme so the mark stays readable.
        "dark:bg-[color-mix(in_oklab,var(--mark)_30%,transparent)] dark:text-[color-mix(in_oklab,var(--mark)_45%,white)]",
        className,
      )}
      style={{ "--mark": accent } as React.CSSProperties}
      aria-hidden
    >
      <Icon className="size-4" strokeWidth={2} />
    </span>
  );
}
