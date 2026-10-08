"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Disclaimer from "@/components/Disclaimer";
import ProbabilityBars from "@/components/ProbabilityBars";
import ArchitectureFlow from "@/components/ArchitectureFlow";
import MetricsPanel from "@/components/MetricsPanel";
import { useAnalysis } from "@/lib/analysis-context";
import { AlertTriangle } from "lucide-react";

const info = [
  ["Input preprocessing", "512 × 512"], ["CNN model input", "224 × 224 × 3"], ["VGG19 features", "512"],
  ["DenseNet121 features", "1024"], ["Combined features", "1536"], ["PCA components", "100"],
  ["Selected features", "30"], ["Classifier", "RBF-SVM"],
];
const explain = [
  ["Crop and resize", "Black borders are removed and the image is scaled to a fixed size so every scan is comparable."],
  ["CLAHE and homomorphic filtering", "Contrast and illumination are evened out so subtle texture is easier for the networks to read."],
  ["VGG19 + DenseNet121", "Two pretrained image networks each turn the picture into a list of numbers (features). Together they give 1536."],
  ["Scaling, PCA and selection", "The features are standardised, compressed to 100 components, and the 30 most informative are kept."],
  ["RBF-SVM", "A classifier compares those 30 values to what it learned from training images and outputs a probability."],
];

function ImageCard({ title, src, alt, text }: { title: string; src: string; alt: string; text: string }) {
  return (
    <figure className="card overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="aspect-square w-full bg-black object-contain" />
      <figcaption className="p-5">
        <h3 className="font-medium">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-cream-muted">{text}</p>
      </figcaption>
    </figure>
  );
}

function Content() {
  const { analysis } = useAnalysis();
  const router = useRouter();
  const [tab, setTab] = useState<"patient" | "expert">("patient");
  useEffect(() => { if (!analysis) router.replace("/analyse"); }, [analysis, router]);
  if (!analysis) return <div className="container-x py-24 text-center text-cream-muted" role="status">No analysis in this session. Taking you back...</div>;

  const { result: r, originalUrl } = analysis;
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const lean = r.predicted_class;

  return (
    <div className="container-x py-12">
      <h1 className="font-display text-4xl sm:text-5xl">Your analysis</h1>
      <div role="tablist" aria-label="Result view" className="mt-6 inline-flex rounded-full border border-cream/15 bg-plum-900 p-1">
        {([["patient", "Patient View"], ["expert", "ML Expert View"]] as const).map(([id, label]) => (
          <button key={id} role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${tab === id ? "bg-rose-soft text-ink" : "text-cream-muted hover:text-cream"}`}>{label}</button>
        ))}
      </div>

      {tab === "patient" && (
        <section role="tabpanel" id="panel-patient" aria-labelledby="tab-patient" className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="card p-7 sm:p-9">
            <h2 className="text-sm text-cream-muted">AI Analysis Result · Model estimate</h2>
            {r.uncertain ? (
              <>
                <p className="mt-4 flex items-center gap-3 font-display text-4xl"><AlertTriangle className="h-7 w-7 text-lavender" aria-hidden="true" />Uncertain result</p>
                <p className="mt-3 leading-relaxed text-cream-muted">
                  The cancer probability falls between {pct(r.uncertainty_range[0])} and {pct(r.uncertainty_range[1])}, so the model result is inconclusive. It should not be read as pointing either way.
                </p>
              </>
            ) : (
              <p className="mt-4 font-display text-4xl leading-tight">The model currently leans toward {lean}.</p>
            )}
            <div className="mt-8">
              <p className="text-sm text-cream-muted">Cancer probability</p>
              <p className="font-display text-6xl tabular-nums">{Math.round(r.cancer_probability * 100)}%</p>
            </div>
            <div className="mt-6"><ProbabilityBars cancer={r.cancer_probability} nonCancer={r.non_cancer_probability} /></div>
            {r.warnings.length > 0 && (
              <ul className="mt-6 space-y-2" aria-label="Notes about this image">
                {r.warnings.map((w) => <li key={w} className="rounded-lg border border-lavender/30 bg-lavender/5 p-3 text-sm text-cream-muted">{w}</li>)}
              </ul>
            )}
          </div>
          <div className="space-y-5">
            <Disclaimer>This result was generated by an AI model and is not a medical diagnosis. Please discuss mammogram findings with a qualified healthcare professional.</Disclaimer>
            <div className="card p-6">
              <h2 className="font-display text-2xl">Whatever the number says, a clinician is the next step.</h2>
              <p className="mt-3 text-sm leading-relaxed text-cream-muted">You&rsquo;re not alone. One careful step at a time.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/find-care" className="btn-primary">Find specialist care</Link>
                <button className="btn-ghost" onClick={() => setTab("expert")}>See how the model decided</button>
              </div>
            </div>
            <Link href="/analyse" className="btn-ghost w-full">Analyse another image</Link>
          </div>
        </section>
      )}

      {tab === "expert" && (
        <section role="tabpanel" id="panel-expert" aria-labelledby="tab-expert" className="mt-8 space-y-14">
          <div>
            <h2 className="font-display text-3xl">Looking inside the black box</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-cream-muted">
              A classifier returns a probability but not a reason. These three images show what went in and which areas pushed the decision.
              Raw model scores: Cancer {pct(r.cancer_probability)}, Non-Cancer {pct(r.non_cancer_probability)}.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <ImageCard title="Original mammogram" src={originalUrl} alt="The mammogram as uploaded" text="Exactly as uploaded. It stays in this browser tab and is not stored." />
              <ImageCard title="Preprocessed model input" src={r.images.preprocessed} alt="Mammogram after cropping, resizing, CLAHE and homomorphic filtering" text="After cropping, 512 × 512 resize, CLAHE and homomorphic filtering. This is the image the networks receive." />
              <ImageCard title="Grad-CAM heatmap / overlay" src={r.images.gradcam_overlay}
                alt={r.heatmap_available ? "Preprocessed mammogram with a coloured Grad-CAM heatmap overlay" : "Preprocessed mammogram without a heatmap"}
                text={r.heatmap_available ? "The highlighted regions indicate image areas that had greater influence on the model's decision. They do not directly identify or diagnose a tumor. Warmer colours mean greater influence." : "No reliable heatmap could be produced for this image, so none is shown."} />
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl">Pipeline architecture</h2>
            <div className="card mt-6 p-6 sm:p-10"><ArchitectureFlow /></div>
          </div>

          <div>
            <h2 className="font-display text-3xl">Model information</h2>
            <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {info.map(([k, v]) => (<div key={k} className="rounded-xl bg-plum-800 p-4"><dt className="text-xs text-cream-muted">{k}</dt><dd className="mt-1 text-lg">{v}</dd></div>))}
            </dl>
            <dl className="mt-6 space-y-4">
              {explain.map(([k, v]) => (<div key={k}><dt className="font-medium">{k}</dt><dd className="mt-1 max-w-3xl text-sm leading-relaxed text-cream-muted">{v}</dd></div>))}
            </dl>
          </div>

          <div>
            <h2 className="font-display text-3xl">Performance metrics</h2>
            <div className="card mt-6 p-6 sm:p-8"><MetricsPanel /></div>
          </div>
          <Disclaimer>This result was generated by an AI model and is not a medical diagnosis. Please discuss mammogram findings with a qualified healthcare professional.</Disclaimer>
        </section>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (<><Navbar /><main id="main"><ProtectedRoute><Content /></ProtectedRoute></main></>);
}
