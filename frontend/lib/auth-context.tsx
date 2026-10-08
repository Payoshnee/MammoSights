"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile, type User,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const Ctx = createContext<AuthCtx | null>(null);

function requireAuth() {
  if (!auth) throw new Error("not-configured");
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user, loading, configured: isFirebaseConfigured,
    signInWithGoogle: async () => { await signInWithPopup(requireAuth(), googleProvider); },
    signInWithEmail: async (email, password) => { await signInWithEmailAndPassword(requireAuth(), email, password); },
    signUpWithEmail: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(requireAuth(), email, password); // Firebase hashes/stores credentials
      if (name) await updateProfile(cred.user, { displayName: name });
    },
    logout: async () => { await signOut(requireAuth()); },
    getToken: async () => (auth?.currentUser ? auth.currentUser.getIdToken() : null),
  }), [user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
