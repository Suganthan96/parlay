export default function Hero() {
  return (
    <section>
      {/* ── ROW A: "Parlay" + halftone ─────────────────── */}
      <div className="page-grid" style={{ borderBottom: "none" }}>
        <div
          className="gc-1-2 bg-white flex flex-col justify-end cell-pad-lg"
          style={{ minHeight: "clamp(320px, 42vh, 580px)" }}
        >
          <h1 className="text-display text-charcoal">Parlay</h1>
        </div>
        <div
          className="gc-3-4 halftone"
          style={{ minHeight: "clamp(320px, 42vh, 580px)" }}
        />
      </div>

      {/* ── ROW B: halftone | description | mint ─────── */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
        <div
          className="gc-1-2 halftone flex flex-col justify-end cell-pad-lg"
          style={{ minHeight: "clamp(260px, 36vh, 480px)" }}
        >
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em", color: "#888", marginBottom: 16 }}>// BUILT ON</p>
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg viewBox="0 0 52 64" style={{ height: 52 }} fill="#111" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="8,26 24,6 36,6 36,58 24,58 24,26"/>
                  <rect x="8" y="50" width="36" height="8"/>
                </svg>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>1inch</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg viewBox="0 0 64 64" style={{ height: 52 }} xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" fill="#111" d="M32 2 L58 17 L58 47 L32 62 L6 47 L6 17 Z M32 16 L46 24 L46 40 L32 48 L18 40 L18 24 Z"/>
                </svg>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>Chainlink</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description — dark */}
        <div
          className="gc-3 flex flex-col justify-between cell-pad"
          style={{ background: "var(--black)", minHeight: "clamp(260px, 36vh, 480px)" }}
        >
          <p className="text-body text-white leading-relaxed">
            The first on-chain parlay. Pick up to 5 live outcomes across sports,
            politics, and crypto — buy one ticket, win big. Chainlink CRE settles
            results trustlessly. LP capital never leaves your wallet.
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
            Prices are powered by LMSR — a constant-sum market maker where every
            outcome&apos;s probability sums to exactly 100%, always.
          </p>
          <div>
            <p className="text-label text-charcoal mb-5">Powered by:</p>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {/* 1inch */}
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 52 64" style={{ height: 28 }} fill="#111" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="8,26 24,6 36,6 36,58 24,58 24,26"/>
                  <rect x="8" y="50" width="36" height="8"/>
                </svg>
                <span className="text-sm font-bold text-charcoal tracking-tight">1inch Aqua</span>
              </div>
              {/* Chainlink */}
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 64 64" style={{ height: 28 }} xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" fill="#111" d="M32 2 L58 17 L58 47 L32 62 L6 47 L6 17 Z M32 16 L46 24 L46 40 L32 48 L18 40 L18 24 Z"/>
                </svg>
                <span className="text-sm font-bold text-charcoal tracking-tight">Chainlink CRE</span>
              </div>
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
            On Chain.
          </h2>
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em", color: "#666", marginBottom: 16 }}>// BUILT ON</p>
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {/* 1inch */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg viewBox="0 0 52 64" style={{ height: 32 }} fill="#fff" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="8,26 24,6 36,6 36,58 24,58 24,26"/>
                  <rect x="8" y="50" width="36" height="8"/>
                </svg>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>1inch</span>
              </div>
              {/* Chainlink */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg viewBox="0 0 64 64" style={{ height: 32 }} xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" fill="#fff" d="M32 2 L58 17 L58 47 L32 62 L6 47 L6 17 Z M32 16 L46 24 L46 40 L32 48 L18 40 L18 24 Z"/>
                </svg>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>Chainlink</span>
              </div>
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
