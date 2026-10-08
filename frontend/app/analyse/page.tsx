"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Circle, ImagePlus, Loader2, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Disclaimer from "@/components/Disclaimer";
import { predict } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAnalysis } from "@/lib/analysis-context";

const MAX_MB = 10;
const stages = ["Preparing image", "Extracting features", "Running classifier", "Generating explanation"];

function Analyser() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { setAnalysis, clear } = useAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [stage, setStage] = useState<number | null>(null);
  const browseRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const handedOver = useRef(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => { clear(); }, [clear]);
  useEffect(() => () => { abortRef.current?.abort(); if (urlRef.current && !handedOver.current) URL.revokeObjectURL(urlRef.current); }, []);

  const reset = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null; setFile(null); setUrl(null); setDims(null);
    if (browseRef.current) browseRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const accept = useCallback((f: File | undefined | null) => {
    if (!f) return;
    setError(null);
    if (!["image/jpeg", "image/png"].includes(f.type)) { setError("Please choose a JPG, JPEG or PNG image."); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`That file is larger than ${MAX_MB} MB.`); return; }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const u = URL.createObjectURL(f);
    urlRef.current = u; setFile(f); setUrl(u); setDims(null);
    const img = new Image();
    img.onload = () => setDims(`${img.naturalWidth} × ${img.naturalHeight} px`);
    img.src = u;
  }, []);

  async function run() {
    if (!file || !url) return;
    setError(null); setStage(0);
    // Stages are indicative of the pipeline order; the real work completes when the server responds.
    const timer = setInterval(() => setStage((s) => (s === null ? s : Math.min(s + 1, stages.length - 1))), 2500);
    const ctl = new AbortController(); abortRef.current = ctl;
    try {
      const result = await predict(file, await getToken(), ctl.signal);
      handedOver.current = true;
      setAnalysis({ result, originalUrl: url, fileName: file.name });
      router.push("/result");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
      setStage(null);
    } finally { clearInterval(timer); }
  }

  if (stage !== null) {
    return (
      <div className="container-x py-20">
        <div className="card mx-auto max-w-lg p-8" role="status" aria-live="polite">
          <h1 className="font-display text-3xl">Analysing your image</h1>
          <p className="mt-2 text-sm text-cream-muted">This can take a little while the first time. Please keep this page open.</p>
          <ul className="mt-7 space-y-4">
            {stages.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 ${i > stage ? "text-cream-dim" : ""}`}>
                {i < stage ? <CheckCircle2 className="h-5 w-5 text-lavender" aria-label="done" /> : i === stage ? <Loader2 className="h-5 w-5 animate-spin text-rose-soft" aria-label="in progress" /> : <Circle className="h-5 w-5" aria-label="waiting" />}
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <button className="btn-ghost mt-8" onClick={() => { abortRef.current?.abort(); setStage(null); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-12">
      <h1 className="font-display text-5xl">Analyse a mammogram</h1>
      <p className="mt-3 max-w-2xl text-cream-muted">Choose a greyscale mammogram image. Nothing is sent until you press the Analyse button.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files?.[0]); }}
              className={`flex min-h-[320px] flex-col items-center justify-center rounded-xl2 border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-rose-soft bg-rose/10" : "border-cream/20 bg-plum-900/60"}`}
            >
              <ImagePlus className="h-10 w-10 text-rose-soft" aria-hidden="true" />
              <p className="mt-4 text-lg">Drag and drop your image here</p>
              <p className="mt-1 text-sm text-cream-muted">JPG, JPEG or PNG, up to {MAX_MB} MB</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" className="btn-primary" onClick={() => browseRef.current?.click()}>Browse files</button>
                <button type="button" className="btn-ghost" onClick={() => cameraRef.current?.click()}><Camera className="h-4 w-4" aria-hidden="true" />Use camera</button>
              </div>
              <p className="mt-4 text-xs text-cream-dim">Camera input works on supported mobile devices.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url!} alt="Preview of the selected mammogram" className="max-h-[480px] w-full bg-black object-contain" />
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-sm text-cream-muted">{dims ?? "Reading size..."} · {(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost !py-2" onClick={() => browseRef.current?.click()}>Change image</button>
                  <button className="btn-ghost !py-2" onClick={reset} aria-label="Remove image"><X className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          )}
          <input ref={browseRef} type="file" accept="image/jpeg,image/png" className="sr-only" tabIndex={-1} aria-label="Choose a mammogram image file" onChange={(e) => accept(e.target.files?.[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-label="Take a photo with the camera" onChange={(e) => accept(e.target.files?.[0])} />
          {error && <p role="alert" className="mt-4 rounded-lg border border-rose/40 bg-rose/10 p-3 text-sm">{error}</p>}
        </div>

        <div className="space-y-5">
          <Disclaimer>Your image is used for analysis and should not be permanently stored by this application.</Disclaimer>
          <Disclaimer>This AI model is not a medical device and does not provide a diagnosis. Photos of screens or printed films will not give meaningful results.</Disclaimer>
          <button className="btn-primary w-full !py-4 text-base" disabled={!file} onClick={run}>Analyse Mammogram</button>
        </div>
      </div>
    </div>
  );
}

export default function AnalysePage() {
  return (<><Navbar /><main id="main"><ProtectedRoute><Analyser /></ProtectedRoute></main></>);
}
