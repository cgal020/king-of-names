"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CardDetails } from "@/lib/cards/parse-qr";

// Hands details read from a business card to the form that uses them next
// (Review in the preview, Add someone otherwise), with the id its card photo
// is held under until that person is saved.

export type CardResult = { details: CardDetails; source: "qr" | "photo"; photoDraftId?: string };

type CardStore = {
  result: CardResult | null;
  setResult: (result: CardResult | null) => void;
};

const CardContext = createContext<CardStore | null>(null);

export function CardProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<CardResult | null>(null);
  const value = useMemo(() => ({ result, setResult }), [result]);
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCardResult() {
  const store = useContext(CardContext);
  if (!store) throw new Error("useCardResult must be used inside CardProvider");
  return store;
}
