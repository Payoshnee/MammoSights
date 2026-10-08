"use client";
// Holds the current result in memory only. Nothing is written to localStorage, Firestore or Storage,
// so a page refresh discards the image and result by design.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PredictResult } from "./api";

type Analysis = { result: PredictResult; originalUrl: string; fileName: string };
type Ctx = { analysis: Analysis | null; setAnalysis: (a: Analysis) => void; clear: () => void };
const C = createContext<Ctx | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysis, set] = useState<Analysis | null>(null);
  const urlRef = useRef<string | null>(null);

  const revoke = () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = null; };
  const setAnalysis = useCallback((a: Analysis) => { revoke(); urlRef.current = a.originalUrl; set(a); }, []);
  const clear = useCallback(() => { revoke(); set(null); }, []);
  useEffect(() => revoke, []);

  const value = useMemo(() => ({ analysis, setAnalysis, clear }), [analysis, setAnalysis, clear]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useAnalysis() {
  const c = useContext(C);
  if (!c) throw new Error("useAnalysis must be used inside AnalysisProvider");
  return c;
}
