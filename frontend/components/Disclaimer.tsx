import { ShieldAlert } from "lucide-react";

export default function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="flex gap-3 rounded-xl border border-lavender/25 bg-lavender/5 p-4 text-sm leading-relaxed text-cream-muted">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-lavender" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
