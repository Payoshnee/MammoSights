import Link from "next/link";
import { Upload, Cpu, ScanEye, MapPin, Layers, Flame, Workflow, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  { icon: Upload, title: "Upload mammogram", text: "Choose a JPG or PNG. Nothing is sent until you press Analyse." },
  { icon: Cpu, title: "AI analysis", text: "The image is prepared, described by two neural networks, and scored by the classifier." },
  { icon: ScanEye, title: "Visual explanation", text: "See the model estimate alongside the processed image and Grad-CAM view." },
  { icon: MapPin, title: "Find nearby care", text: "Explore mapped cancer-care and hospital options near a location you choose." },
];

const views = [
  { icon: ImageIcon, title: "Original mammogram", text: "The image you selected for the current analysis." },
  { icon: Layers, title: "Processed image", text: "The enhanced image representation used by the model." },
  { icon: Flame, title: "Grad-CAM view", text: "Regions that had greater influence on the model output." },
  { icon: Workflow, title: "Pipeline details", text: "The processing path from image input to classifier probability." },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <section id="about" className="bg-[#fde8ee]">
          <div className="container-x grid min-h-[610px] items-center gap-10 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-16">
            <div className="relative z-10">
              <h1 className="max-w-2xl font-display text-5xl font-semibold leading-[1.04] text-rose-deep sm:text-6xl lg:text-7xl">
                Clarity when you need it most.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-muted">
                Uncertainty can feel heavy. MammoSights presents AI-assisted mammogram analysis with clear visual explanations, so each model result is easier to understand and discuss with a healthcare professional.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/analyse" className="btn-primary">Begin Analysis</Link>
                <Link href="/#how-it-works" className="btn-ghost">See how it works</Link>
              </div>
            </div>

            <div className="flex items-end justify-center self-stretch md:justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mammosights-hero.png"
                alt="Pink breast cancer awareness illustration"
                className="max-h-[520px] w-full max-w-[430px] object-contain object-bottom drop-shadow-[0_28px_35px_rgba(126,12,46,0.12)]"
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="container-x py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-soft">Simple steps</p>
            <h2 className="mt-3 font-display text-4xl text-rose-deep sm:text-5xl">How it works</h2>
            <p className="mt-4 leading-relaxed text-cream-muted">A clear path from image upload to model explanation, without hiding the important technical details.</p>
          </div>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="card h-full p-6">
                <div className="flex items-center justify-between">
                  <s.icon className="h-6 w-6 text-rose-deep" aria-hidden="true" />
                  <span className="font-display text-2xl text-rose-soft" aria-label={`Step ${i + 1}`}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-rose-deep">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="explainable-ai" className="bg-plum-900/70 py-20">
          <div className="container-x grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-soft">Explainable AI</p>
              <h2 className="mt-3 font-display text-4xl text-rose-deep sm:text-5xl">More than a number.</h2>
              <p className="mt-5 max-w-lg leading-relaxed text-cream-muted">
                MammoSights pairs the model estimate with the image representations and explanation view used to inspect what influenced the result.
              </p>
              <Link href="/analyse" className="btn-primary mt-7">Try it with an image</Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {views.map((v) => (
                <li key={v.title} className="card p-5">
                  <v.icon className="h-5 w-5 text-rose-deep" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-rose-deep">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-cream-muted">{v.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="safety" className="container-x py-20">
          <div className="rounded-[2rem] border border-rose-deep/10 bg-white p-8 shadow-soft sm:p-10">
            <h2 className="font-display text-3xl text-rose-deep">A careful note before you begin</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-cream-muted">
              MammoSights is an AI-assisted demonstration and is not a medical device. Its output is not a diagnosis and should not replace review by a qualified healthcare professional.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cream-muted">
              Mammograms are used for the current analysis only. The application is designed not to keep a permanent image or prediction history in your account.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
