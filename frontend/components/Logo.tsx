import Link from "next/link";

export function RibbonMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d="M24 14c-6-9-16-3-10 5l10 18" stroke="#a60f3c" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 14c6-9 16-3 10 5L24 37" stroke="#d56c8b" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="MammoSights home">
      <RibbonMark />
      <span className="font-display text-2xl font-semibold tracking-tight text-rose-deep">MammoSights</span>
    </Link>
  );
}
