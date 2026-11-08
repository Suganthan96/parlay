import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Web3Provider } from "@/providers/Web3Provider";
import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Parlay Markets — On-chain parlays on Sui",
  description: "Sports parlay prediction markets on Sui. Tatum bookmaker odds, Walrus Memory trust scores, NFT tickets. Win SUI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
