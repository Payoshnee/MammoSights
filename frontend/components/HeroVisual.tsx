"use client";
import { motion, useReducedMotion } from "framer-motion";

/** Abstract SVG: soft concentric tissue-like rings, a quiet awareness-ribbon outline. No imagery, no photography. */
export default function HeroVisual() {
  const reduce = useReducedMotion();
  const fade = (d: number) => reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1.4, delay: d } };
  return (
    <svg viewBox="0 0 520 520" role="img" aria-label="Abstract illustration of soft concentric rings with a ribbon outline" className="h-auto w-full max-w-[520px]">
      <defs>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#d9a7b4" stopOpacity=".55" />
          <stop offset="1" stopColor="#d9a7b4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#b6a6d6" stopOpacity=".22" />
          <stop offset="1" stopColor="#b6a6d6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.circle cx="260" cy="260" r="250" fill="url(#halo)" {...fade(0)} />
      {[220, 180, 140, 100].map((r, i) => (
        <motion.ellipse key={r} cx="260" cy="260" rx={r} ry={r * (0.92 - i * 0.02)} fill="none"
          stroke={i % 2 ? "#b6a6d6" : "#c98a9b"} strokeOpacity={0.22 + i * 0.07} strokeWidth="1.2"
          transform={`rotate(${-14 + i * 9} 260 260)`} {...fade(0.15 * i)} />
      ))}
      <motion.circle cx="260" cy="260" r="86" fill="url(#core)" {...fade(0.7)} />
      <motion.g {...fade(1)} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="13">
        <path d="M260 170 C 205 105, 150 160, 195 215 L 262 330" stroke="#d9a7b4" strokeOpacity=".9" />
        <path d="M260 170 C 315 105, 370 160, 325 215 L 258 330" stroke="#b6a6d6" strokeOpacity=".85" />
      </motion.g>
      <circle cx="404" cy="150" r="3" fill="#d9a7b4" opacity=".7" />
      <circle cx="120" cy="380" r="2.5" fill="#b6a6d6" opacity=".7" />
      <circle cx="430" cy="330" r="2" fill="#f3ebe6" opacity=".4" />
    </svg>
  );
}
