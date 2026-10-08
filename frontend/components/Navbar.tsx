"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#explainable-ai", label: "Explainable AI" },
  { href: "/find-care", label: "Find Care" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-rose-deep/10 bg-ink/95 backdrop-blur-xl">
      <nav className="container-x flex h-16 items-center justify-between" aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-8 text-sm font-medium text-cream-muted md:flex">
          {links.map((l) => (
            <li key={l.href}><Link href={l.href} className="transition-colors hover:text-rose-deep">{l.label}</Link></li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost min-w-[104px] !py-2">Dashboard</Link>
              <Link href="/analyse" className="btn-primary min-w-[104px] !py-2">Analyse</Link>
              <button onClick={() => logout()} className="btn-ghost min-w-[104px] !py-2">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost min-w-[96px] !py-2">Sign In</Link>
              <Link href="/login?mode=signup" className="btn-primary min-w-[112px] !py-2">Get Started</Link>
            </>
          )}
        </div>
        <button className="rounded-full p-2 text-rose-deep md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-rose-deep/10 bg-ink md:hidden">
          <ul className="container-x flex flex-col gap-1 py-4">
            {links.map((l) => (
              <li key={l.href}><Link href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-cream-muted hover:bg-white hover:text-rose-deep">{l.label}</Link></li>
            ))}
            <li className="mt-2 grid gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="btn-ghost" onClick={() => setOpen(false)}>Dashboard</Link>
                  <Link href="/analyse" className="btn-primary" onClick={() => setOpen(false)}>Analyse</Link>
                  <button onClick={() => logout()} className="btn-ghost">Log out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost" onClick={() => setOpen(false)}>Sign In</Link>
                  <Link href="/login?mode=signup" className="btn-primary" onClick={() => setOpen(false)}>Get Started</Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
