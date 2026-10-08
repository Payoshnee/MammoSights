"use client";
import { useEffect, useState } from "react";
import { fetchMetrics, type Metrics } from "@/lib/api";

const pct = (v?: number) => (typeof v === "number" ? `${(v * 100).toFixed(1)}%` : "-");
const pm = (v?: [number, number]) => (v ? `${(v[0] * 100).toFixed(1)}% ± ${(v[1] * 100).toFixed(1)}%` : "-");

export default function MetricsPanel() {
  const [m, setM] = useState<Metrics | null | undefined>(undefined);
  useEffect(() => { fetchMetrics().then(setM); }, []);

  if (m === undefined) return <p className="text-sm text-cream-muted" role="status">Loading metrics...</p>;
  if (!m || !m.test) return <p className="text-sm text-cream-muted">Metrics unavailable.</p>;

  const t = m.test, c = t.confusion, cv = m.cv5_on_train;
  const tiles = [
    ["Accuracy", pct(t.accuracy)],
    ["Cancer sensitivity", pct(t.sensitivity_cancer)],
    ["Specificity", pct(t.specificity)],
    ["AUC", typeof t.auc === "number" ? t.auc.toFixed(3) : "-"],
  ];
  return (
    <div>
      <p className="text-sm text-cream-muted">Held-out test set{m.n_test ? ` (${m.n_test} images)` : ""}. Values come directly from the model's metrics file.</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-plum-800 p-4">
            <dt className="text-xs text-cream-muted">{k}</dt>
            <dd className="mt-1 font-display text-3xl">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {c && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Confusion matrix</h4>
            <table className="w-full text-sm">
              <caption className="sr-only">Confusion matrix on the held-out test set</caption>
              <thead><tr className="text-cream-muted"><th className="p-2 text-left font-normal"><span className="sr-only">Actual</span></th><th className="p-2 font-normal">Predicted Non-Cancer</th><th className="p-2 font-normal">Predicted Cancer</th></tr></thead>
              <tbody className="text-center">
                <tr><th scope="row" className="p-2 text-left font-normal text-cream-muted">Actual Non-Cancer</th><td className="rounded bg-plum-800 p-2">{c.TN} <span className="text-xs text-cream-dim">(TN)</span></td><td className="rounded bg-plum-800 p-2">{c.FP} <span className="text-xs text-cream-dim">(FP)</span></td></tr>
                <tr><th scope="row" className="p-2 text-left font-normal text-cream-muted">Actual Cancer</th><td className="rounded bg-plum-800 p-2">{c.FN_missed_cancers} <span className="text-xs text-cream-dim">(FN)</span></td><td className="rounded bg-plum-800 p-2">{c.TP} <span className="text-xs text-cream-dim">(TP)</span></td></tr>
              </tbody>
            </table>
          </div>
        )}
        {cv && (
          <div>
            <h4 className="mb-2 text-sm font-medium">5-fold cross-validation (training data)</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between rounded-lg bg-plum-800 px-4 py-2"><dt className="text-cream-muted">Accuracy</dt><dd className="tabular-nums">{pm(cv.accuracy)}</dd></div>
              <div className="flex justify-between rounded-lg bg-plum-800 px-4 py-2"><dt className="text-cream-muted">Cancer sensitivity</dt><dd className="tabular-nums">{pm(cv.sensitivity_cancer)}</dd></div>
              <div className="flex justify-between rounded-lg bg-plum-800 px-4 py-2"><dt className="text-cream-muted">AUC</dt><dd className="tabular-nums">{pm(cv.auc)}</dd></div>
            </dl>
          </div>
        )}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-cream-dim">Small public dataset; not clinically validated. Strong figures on a held-out set from one dataset do not guarantee the same performance on other scanners, populations or hospitals.</p>
    </div>
  );
}
