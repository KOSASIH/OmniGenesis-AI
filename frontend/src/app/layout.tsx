import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OmniGenesis AI — The Divine Architect of Infinite Innovation",
  description: "Multi-agent AI platform powering the PiNexus ecosystem with autonomous blockchain operations, advanced DeFi protocols, and Phase 12 super-advanced features.",
  keywords: ["OmniGenesis", "AI", "blockchain", "DeFi", "PiNexus", "AetherNova"],
  openGraph: {
    title: "OmniGenesis AI",
    description: "The Divine Architect of Infinite Innovation",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/6 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/4 rounded-full blur-3xl" />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
