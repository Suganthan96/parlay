import TatumLogo from "./TatumLogo";
import WalrusLogo from "./WalrusLogo";

export default function Hero() {
  return (
    <section>
      {/* ── ROW A: "Parlay" + halftone ─────────────────── */}
      <div className="page-grid" style={{ borderBottom: "none" }}>
        <div
          className="gc-1-2 bg-white flex flex-col justify-end cell-pad-lg"
          style={{ minHeight: "clamp(320px, 42vh, 580px)" }}
        >
          <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em", color: "#aaa", marginBottom: 14 }}>
            // TATUM × WALRUS · TOTAL RECALL HACKATHON · NOV 2026
          </p>
          <h1 className="text-display text-charcoal">Parlay</h1>
        </div>
        <div
          className="gc-3-4 halftone"
          style={{ minHeight: "clamp(320px, 42vh, 580px)" }}
        />
      </div>

      {/* ── ROW B: built on | description | mint ─────── */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
        <div
          className="gc-1-2 halftone flex flex-col justify-end cell-pad-lg"
          style={{ minHeight: "clamp(260px, 36vh, 480px)" }}
        >
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em", color: "#888", marginBottom: 16 }}>// POWERED BY</p>
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <TatumLogo variant="dark" height={36} />
              <WalrusLogo color="#111111" height={28} />
            </div>
          </div>
        </div>

        {/* Description — dark */}
        <div
          className="gc-3 flex flex-col justify-between cell-pad"
          style={{ background: "var(--black)", minHeight: "clamp(260px, 36vh, 480px)" }}
        >
          <p className="text-body text-white leading-relaxed">
            The first on-chain parlay on Sui Mainnet. Pick up to 5 live prediction
            market outcomes — sports, politics, crypto — buy one NFT ticket,
            win big. Tatum RPC reads the chain. Walrus Memory learns from every bet.
          </p>
          <a href="#how-it-works" className="arrow-btn mt-8">
            <span className="tracking-widest uppercase text-xs font-semibold">
              See How It Works
            </span>
            <span
              className="inline-flex items-center justify-center rounded-sm text-charcoal"
              style={{ width: 28, height: 28, background: "var(--white)", flexShrink: 0 }}
            >
              →
            </span>
          </a>
        </div>

        {/* Mint panel */}
        <div
          className="gc-4 flex flex-col justify-between cell-pad"
          style={{ background: "var(--mint)", minHeight: "clamp(260px, 36vh, 480px)" }}
        >
          <p className="text-body text-charcoal leading-relaxed">
            Walrus Memory stores every bet, outcome, and credibility score.
            The app gets smarter with each market that resolves — surfacing the
            most reliable predictions over time.
          </p>
          <div>
            <p className="text-label text-charcoal mb-5">Powered by:</p>
            <div className="flex flex-wrap gap-x-8 gap-y-4 items-center">
              <TatumLogo variant="dark" height={22} />
              <WalrusLogo color="#111111" height={18} />
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW C: halftone | "Markets" ───────────────── */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
        <div
          className="gc-1-2 halftone-dark"
          style={{ minHeight: "clamp(240px, 36vh, 480px)" }}
        />
        <div
          className="gc-3-4 flex flex-col justify-end cell-pad-lg"
          style={{ background: "var(--light-gray)", minHeight: "clamp(240px, 36vh, 480px)" }}
        >
          <h2 className="text-display text-charcoal">Markets</h2>
        </div>
      </div>

      {/* ── ROW D: "THE FIRST PARLAY. ON CHAIN." | halftone */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
        <div
          className="gc-1-2 flex flex-col justify-between cell-pad-lg"
          style={{ background: "var(--black)", minHeight: "clamp(260px, 38vh, 500px)" }}
        >
          <h2
            className="text-display-sm text-white uppercase"
            style={{ letterSpacing: "-0.02em" }}
          >
            The First
            <br />
            Parlay.
            <br />
            On Sui.
          </h2>
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em", color: "#666", marginBottom: 16 }}>// TRACK 1 — MARKETS & SPORTS PREDICTION</p>
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <TatumLogo variant="light" height={28} />
              <WalrusLogo color="#FAF8F5" height={22} />
            </div>
          </div>
        </div>
        <div
          className="gc-3-4 halftone"
          style={{ minHeight: "clamp(260px, 38vh, 500px)" }}
        />
      </div>
    </section>
  );
}
