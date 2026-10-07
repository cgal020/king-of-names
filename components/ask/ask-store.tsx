"use client";

import { createContext, useContext, useMemo, useState } from "react";

// Hands a question typed in People search over to the Ask tab, without
// putting it in the URL (URLs end up in server logs).

type AskStore = {
  pending: string | null;
  setPending: (question: string | null) => void;
};

const AskContext = createContext<AskStore | null>(null);

export function AskProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<string | null>(null);
  const value = useMemo(() => ({ pending, setPending }), [pending]);
  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}

export function useAskStore() {
  const store = useContext(AskContext);
  if (!store) throw new Error("useAskStore must be used inside AskProvider");
  return store;
}
