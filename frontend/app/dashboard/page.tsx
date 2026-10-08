"use client";
import Link from "next/link";
import { Microscope, BrainCircuit, MapPin, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

const cards = [
  { href: "/analyse", icon: Microscope, title: "Analyse Mammogram", text: "Upload an image and see the model's estimate with visual explanations." },
  { href: "/#explainable-ai", icon: BrainCircuit, title: "Understand the AI", text: "How the model works, and what its heatmaps can and cannot tell you." },
  { href: "/find-care", icon: MapPin, title: "Find Specialist Care", text: "Explore breast-care and oncology services near you." },
  { href: "/#about", icon: BookOpen, title: "About the Model", text: "How MammoSights processes an image, explains its output, and where its limits are." },
];

function Content() {
  const { user } = useAuth();
  const first = user?.displayName?.split(" ")[0];
  return (
    <div className="container-x py-14">
      <h1 className="font-display text-5xl">Welcome back{first ? `, ${first}` : ""}</h1>
      <p className="mt-3 text-lg text-cream-muted">Take the next step with information and support.</p>
      <Link href="/analyse" className="btn-primary mt-8">Analyse a Mammogram</Link>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.title}>
            <Link href={c.href} className="card block h-full p-7 transition-colors hover:border-rose-soft/50">
              <c.icon className="h-6 w-6 text-rose-soft" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-medium">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-cream-muted">{c.text}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-cream-dim">Clear information, one careful step at a time.</p>
    </div>
  );
}

export default function Dashboard() {
  return (<><Navbar /><main id="main"><ProtectedRoute><Content /></ProtectedRoute></main></>);
}
