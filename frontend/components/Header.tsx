"use client";

import { useState, useEffect } from "react";
import AspenLogo from "./AspenLogo";

function useClock(tz: string, label: string) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    const update = () => {
      const t = new Date().toLocaleTimeString("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setDisplay(`${t} ${label}`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [tz, label]);
  return display;
}

export default function Header() {
  const istTime = useClock("Asia/Kolkata", "IST");
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = ["How It Works", "Built On", "Protocol", "Team", "Pitch"];

  return (
    <header
      className="sticky top-0 z-50 bg-white"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* ── desktop ── */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* left: logo + clock */}
        <div
          className="flex items-center gap-4 px-6"
          style={{ height: 60, borderRight: "1px solid var(--border)" }}
        >
          <AspenLogo size={22} />
          <span className="font-semibold tracking-tight" style={{ fontSize: 13 }}>PARLAY</span>
        </div>

        {/* right: nav + cta */}
        <div className="flex items-center justify-between px-6" style={{ height: 60 }}>
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link}
                href={link === "Pitch" ? "/pitch" : `#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-charcoal hover:opacity-60 transition-opacity"
                style={link === "Pitch" ? { fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 11 } : {}}
              >
                {link}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="/markets"
              className="flex items-center gap-2 text-sm font-semibold tracking-wide"
            >
              Launch App
              <span className="text-base">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── mobile ── */}
      <div
        className="flex md:hidden items-center justify-between px-5"
        style={{ height: 56 }}
      >
        <div className="flex items-center gap-3">
          <AspenLogo size={20} />
          <span className="font-semibold tracking-tight text-sm">PARLAY</span>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-sm font-semibold tracking-widest uppercase"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <div
          className="flex md:hidden flex-col border-t"
          style={{ borderColor: "var(--border)" }}
        >
          {navLinks.map((link) => (
            <a
              key={link}
              href={link === "Pitch" ? "/pitch" : `#${link.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setMenuOpen(false)}
              className="px-5 py-4 text-sm font-medium border-b"
              style={{ borderColor: "var(--border)" }}
            >
              {link}
            </a>
          ))}
          <a
            href="/markets"
            onClick={() => setMenuOpen(false)}
            className="px-5 py-4 text-sm font-semibold flex items-center gap-2"
          >
            Launch App <span>→</span>
          </a>
        </div>
      )}
    </header>
  );
}
