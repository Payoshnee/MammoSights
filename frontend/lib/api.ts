const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export type PredictResult = {
  predicted_class: "Cancer" | "Non-Cancer";
  cancer_probability: number;
  non_cancer_probability: number;
  uncertain: boolean;
  uncertainty_range: [number, number];
  heatmap_available: boolean;
  warnings: string[];
  images: { gradcam_overlay: string; preprocessed: string; clahe: string };
};

export type Metrics = {
  n_train?: number;
  n_test?: number;
  positive_class?: string;
  test?: {
    accuracy?: number; sensitivity_cancer?: number; specificity?: number; auc?: number;
    confusion?: { TN: number; FP: number; FN_missed_cancers: number; TP: number };
  };
  cv5_on_train?: { accuracy?: [number, number]; sensitivity_cancer?: [number, number]; auc?: [number, number] };
};

async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j.detail === "string") return j.detail;
  } catch { /* ignore */ }
  return `The server returned an error (${res.status}).`;
}

export async function predict(file: File, token?: string | null, signal?: AbortSignal): Promise<PredictResult> {
  const body = new FormData();
  body.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${API}/predict`, {
      method: "POST", body, signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new Error("Could not reach the analysis server. Check that the backend is running.");
  }
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function fetchMetrics(): Promise<Metrics | null> {
  try {
    const res = await fetch(`${API}/metrics`, { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
