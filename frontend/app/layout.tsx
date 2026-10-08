import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Figtree } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AnalysisProvider } from "@/lib/analysis-context";

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "MammoSights - Clarity when you need it most",
  description: "AI-assisted mammogram analysis with visual explanations. Not a medical device and not a diagnosis.",
};
export const viewport: Viewport = { themeColor: "#fff8f8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-rose-deep focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <AuthProvider>
          <AnalysisProvider>{children}</AnalysisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
