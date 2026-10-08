import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-rose-deep/10 bg-white/55">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.3fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream-muted">
            AI-assisted mammogram analysis with visual explanations designed to make model outputs easier to understand. Not a medical device.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-rose-deep">Explore</h2>
          <ul className="mt-3 grid gap-2 text-sm text-cream-muted sm:grid-cols-2">
            <li><Link href="/#how-it-works" className="hover:text-rose-deep">How It Works</Link></li>
            <li><Link href="/#explainable-ai" className="hover:text-rose-deep">Explainable AI</Link></li>
            <li><Link href="/find-care" className="hover:text-rose-deep">Find Care</Link></li>
            <li><Link href="/#safety" className="hover:text-rose-deep">Privacy & Safety</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rose-deep/10 py-5 text-center text-xs text-cream-dim">
        MammoSights does not provide medical diagnosis or treatment advice.
      </div>
    </footer>
  );
}
