"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";

const errorText: Record<string, string> = {
  "auth/invalid-credential": "That email and password do not match.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/popup-closed-by-user": "The Google window was closed before sign-in finished.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, configured, signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);

  const fail = (e: unknown) => {
    const code = (e as { code?: string }).code ?? (e as Error).message;
    setError(code === "not-configured" ? "Sign-in is not configured yet. Add the Firebase values to .env.local." : errorText[code] ?? "Something went wrong. Please try again.");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirm) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      if (mode === "signup") await signUpWithEmail(name.trim(), email.trim(), password);
      else await signInWithEmail(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function google() {
    setError(null); setBusy(true);
    try { await signInWithGoogle(); router.replace("/dashboard"); } catch (err) { fail(err); } finally { setBusy(false); }
  }

  const signup = mode === "signup";
  return (
    <div className="container-x grid min-h-[calc(100vh-4rem)] items-center gap-12 py-12 md:grid-cols-2">
      <div className="hidden md:block">
        <h1 className="font-display text-5xl leading-tight">A clearer way to review each model result.</h1>
        <p className="mt-5 max-w-md text-cream-muted">Your account only identifies you. Mammograms and results are never saved to it.</p>
      </div>
      <div className="card mx-auto w-full max-w-md p-7 sm:p-9">
        <h2 className="font-display text-3xl">{signup ? "Create your account" : "Welcome back"}</h2>
        {!configured && <p role="alert" className="mt-4 rounded-lg bg-plum-700 p-3 text-sm text-cream-muted">Firebase is not configured. Add your values to <code className="text-rose-soft">.env.local</code> to enable sign-in.</p>}
        <button type="button" onClick={google} disabled={busy} className="btn-ghost mt-6 w-full">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.800 3.400 14.600 2.400 12 2.400 6.700 2.400 2.400 6.700 2.400 12s4.300 9.600 9.600 9.600c5.500 0 9.200-3.900 9.200-9.400 0-.6-.1-1.100-.2-1.600H12z" /></svg>
          Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs text-cream-dim"><span className="h-px flex-1 bg-cream/10" />or with email<span className="h-px flex-1 bg-cream/10" /></div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {signup && (
            <div><label htmlFor="name" className="label">Name</label><input id="name" className="field" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          )}
          <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" className="field" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input id="password" type={show ? "text" : "password"} className="field pr-12" autoComplete={signup ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-cream-muted hover:text-cream" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {signup && (
            <div><label htmlFor="confirm" className="label">Confirm password</label><input id="confirm" type={show ? "text" : "password"} className="field" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          )}
          {error && <p role="alert" className="rounded-lg border border-rose/40 bg-rose/10 p-3 text-sm">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-cream-muted">
          {signup ? "Already have an account?" : "New to MammoSights?"}{" "}
          <button type="button" className="font-medium text-rose-soft underline underline-offset-4" onClick={() => { setMode(signup ? "signin" : "signup"); setError(null); }}>
            {signup ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main id="main"><Suspense fallback={null}><LoginForm /></Suspense></main>
    </>
  );
}
