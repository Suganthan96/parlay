"use client";

import { useState, useEffect } from "react";
import AspenLogo from "./AspenLogo";

function useClock(tz: string) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    const update = () => {
      setDisplay(
        new Date().toLocaleTimeString("en-US", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [tz]);
  return display;
}

function ClockWidget({ city, tz }: { city: string; tz: string }) {
  const time = useClock(tz);
  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ width: 36, height: 36, borderColor: "var(--border)" }}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 7v5l3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold leading-none">{city}</p>
        <p className="tabular-nums text-sm mt-1 opacity-50">{time}</p>
      </div>
    </div>
  );
}

const navLinks = ["How It Works", "Built On", "Protocol", "Team"];

export default function Footer() {
  return (
    <footer>
      {/* ── Contact section ─────────────────────────── */}
      <div
        className="page-grid"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}
      >
        {/* Tagline */}
        <div
          className="gc-1-2 bg-white flex flex-col justify-center cell-pad"
          style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
        >
          <h3
            style={{
              fontSize: "clamp(24px, 3.5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
            }}
          >
            Build the first
            <br />
            parlay.
          </h3>
        </div>

        {/* Nav links */}
        <div
          className="gc-3 bg-white flex flex-col justify-center cell-pad gap-4"
          style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
        >
          {navLinks.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-base font-medium hover:opacity-50 transition-opacity"
            >
              {l}
            </a>
          ))}
        </div>

        {/* Clocks */}
        <div
          className="gc-4 bg-white flex flex-col justify-center cell-pad gap-6"
          style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
        >
          <ClockWidget city="Mumbai"    tz="Asia/Kolkata"       />
          <ClockWidget city="Zürich"    tz="Europe/Zurich"      />
        </div>
      </div>

      {/* ── Links row ──────────────────────────────── */}
      <div
        className="page-grid"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}
      >
        <div className="gc-1-2 bg-white" style={{ minHeight: 0 }} />
        <div
          className="gc-3 bg-white flex items-center cell-pad"
          style={{ minHeight: 60 }}
        >
          <a
            href="https://ethglobal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:opacity-50 transition-opacity"
          >
            ETHGlobal Mumbai 2026
          </a>
        </div>
        <div
          className="gc-4 bg-white flex items-center cell-pad"
          style={{ minHeight: 60 }}
        >
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:opacity-50 transition-opacity flex items-center gap-1"
          >
            GitHub ↗
          </a>
        </div>
      </div>

      {/* ── Dark logo + Mint CTA ──────────────────────── */}
      <div
        className="page-grid"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}
      >
        {/* Dark half: logo */}
        <div
          className="gc-1-2 flex flex-col items-center justify-center gap-4"
          style={{ background: "var(--black)", minHeight: "clamp(220px, 30vh, 400px)" }}
        >
          <AspenLogo size={64} className="text-white" />
          <span
            className="text-white"
            style={{
              fontSize: "clamp(28px, 4vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            parlay
          </span>
        </div>

        {/* Mint half: CTA */}
        <div
          className="gc-3-4 flex flex-col justify-between cell-pad"
          style={{ background: "var(--mint)", minHeight: "clamp(220px, 30vh, 400px)" }}
        >
          <h3
            style={{
              fontSize: "clamp(22px, 3vw, 46px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "var(--black)",
            }}
          >
            Hackathon prototype.
            <br />
            Testnet only.
          </h3>
          <a
            href="#how-it-works"
            className="text-sm font-semibold tracking-widest uppercase flex items-center gap-2"
            style={{ color: "var(--black)" }}
          >
            See how it works
            <span
              className="inline-flex items-center justify-center rounded-sm"
              style={{
                width: 26,
                height: 26,
                background: "var(--black)",
                color: "white",
                flexShrink: 0,
              }}
            >
              →
            </span>
          </a>
        </div>
      </div>

      {/* ── Copyright bar ────────────────────────────── */}
      <div
        className="page-grid"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="gc-1-2 flex items-center cell-pad"
          style={{ background: "var(--black)", minHeight: 52 }}
        >
          <p className="text-label text-white opacity-40">
            © {new Date().getFullYear()} PARLAY MARKETS&nbsp;•&nbsp;Testnet / Fork Only
          </p>
        </div>
        <div
          className="gc-3-4 flex items-center cell-pad"
          style={{ background: "var(--mint)", minHeight: 52 }}
        >
          <p className="text-label opacity-50" style={{ color: "var(--black)" }}>
            Built on 1inch Aqua · Chainlink CRE
          </p>
        </div>
      </div>
    </footer>
  );
}
