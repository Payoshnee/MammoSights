import { ArrowDown } from "lucide-react";

const Step = ({ title, note }: { title: string; note?: string }) => (
  <div className="w-full max-w-sm rounded-xl border border-cream/12 bg-plum-800 px-5 py-3 text-center">
    <p className="text-sm font-medium">{title}</p>
    {note && <p className="mt-0.5 text-xs text-cream-muted">{note}</p>}
  </div>
);
const Arrow = () => <ArrowDown className="h-5 w-5 shrink-0 text-rose/70" aria-hidden="true" />;

export default function ArchitectureFlow() {
  return (
    <div className="flex flex-col items-center gap-2" role="group" aria-label="Machine-learning pipeline, from input mammogram to probabilities">
      <Step title="Input mammogram" note="JPG / PNG, converted to greyscale" />
      <Arrow />
      <Step title="Crop black borders" />
      <Arrow />
      <Step title="Resize to 512 × 512" />
      <Arrow />
      <Step title="CLAHE" note="Local contrast enhancement" />
      <Arrow />
      <Step title="Homomorphic filtering" note="Evens out illumination, keeps fine texture" />
      <Arrow />
      <p className="text-xs text-cream-muted">Resized to 224 × 224 × 3, then split into two feature extractors</p>
      <div className="grid w-full max-w-xl grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="rounded-xl border border-rose/40 bg-rose/10 px-5 py-4 text-center">
          <p className="text-sm font-medium">VGG19</p>
          <p className="text-xs text-cream-muted">512 features</p>
        </div>
        <span className="text-center text-lg text-cream-muted" aria-label="plus">+</span>
        <div className="rounded-xl border border-lavender/40 bg-lavender/10 px-5 py-4 text-center">
          <p className="text-sm font-medium">DenseNet121</p>
          <p className="text-xs text-cream-muted">1024 features</p>
        </div>
      </div>
      <Arrow />
      <Step title="1536 combined features" />
      <Arrow />
      <Step title="StandardScaler" />
      <Arrow />
      <Step title="PCA" note="1536 → 100 components" />
      <Arrow />
      <Step title="Feature selection" note="100 → 30 features" />
      <Arrow />
      <Step title="StandardScaler" />
      <Arrow />
      <Step title="RBF-SVM classifier" />
      <Arrow />
      <div className="w-full max-w-sm rounded-xl border border-cream/25 bg-plum-700 px-5 py-3 text-center">
        <p className="text-sm font-medium">Cancer probability / Non-Cancer probability</p>
      </div>
    </div>
  );
}
