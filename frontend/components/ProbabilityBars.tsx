const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function ProbabilityBars({ cancer, nonCancer }: { cancer: number; nonCancer: number }) {
  const rows = [
    { label: "Cancer", v: cancer, bar: "bg-rose-soft" },
    { label: "Non-Cancer", v: nonCancer, bar: "bg-lavender" },
  ];
  return (
    <div className="space-y-5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-cream">{r.label}</span>
            <span className="font-medium tabular-nums">{pct(r.v)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-plum-700" role="meter" aria-label={`${r.label} probability`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.v * 100)}>
            <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${Math.max(r.v * 100, 0.5)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
