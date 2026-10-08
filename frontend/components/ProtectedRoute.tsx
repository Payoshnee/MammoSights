"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

/** Client-side guard. It controls UI access only; the API enforces real access by verifying Firebase ID tokens (REQUIRE_AUTH=true). */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  // Local-development convenience only; ignored in production builds.
  const devSkip = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true";

  useEffect(() => { if (!devSkip && configured && !loading && !user) router.replace("/login"); }, [devSkip, configured, loading, user, router]);

  if (devSkip) return <>{children}</>;
  if (!configured) {
    return (
      <div className="container-x py-24">
        <div className="card mx-auto max-w-xl p-8">
          <h1 className="font-display text-3xl">Sign-in is not configured yet</h1>
          <p className="mt-3 text-cream-muted">Add your Firebase values to <code className="text-rose-soft">frontend/.env.local</code> (see <code className="text-rose-soft">.env.example</code>) and restart the dev server.</p>
          <Link href="/" className="btn-ghost mt-6">Back to home</Link>
        </div>
      </div>
    );
  }
  if (loading || !user) return <div className="container-x py-24 text-center text-cream-muted" role="status">Checking your session...</div>;
  return <>{children}</>;
}
