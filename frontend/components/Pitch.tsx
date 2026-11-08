const problemStats = [
  { n: "$83B",  label: "Global sports betting market",        bg: "var(--black)",      color: "white"           },
  { n: "40%",   label: "Sportsbook revenue from parlays",     bg: "var(--light-gray)", color: "var(--black)"    },
  { n: "$1B+",  label: "Polymarket volume in 2024",           bg: "var(--mint)",       color: "var(--black)"    },
  { n: "0",     label: "On-chain parlay products today",      bg: "var(--white)",      color: "var(--black)"    },
];

const sponsors = [
  {
    name: "1inch Aqua",
    color: "#1dc3fa",
    role: "Virtual Liquidity Layer",
    what: "LP approves Aqua once. USDC stays in wallet. Aqua only calls transferFrom(LP → Vault) when a user wins. Zero capital lockup. Zero counterparty risk.",
    code: "Aqua.ship(Router, strategy, [USDC], [$1945])\nAqua.pull(LP, stratHash, USDC, $4.00)",
    bg: "var(--black)",
  },
  {
    name: "Chainlink CRE",
    color: "#375bd2",
    role: "Automated Oracle Settlement",
    what: "Custom Runtime Environment watches for SettlementRequested events. Fetches final outcome from Polymarket API off-chain. Calls MarketResolver.resolve() on-chain. Fully automated — zero manual intervention.",
    code: "emit SettlementRequested(matchId, marketAddr)\nCRE → MarketResolver.resolve(matchId, Outcome)",
    bg: "var(--white)",
  },
  {
    name: "Polymarket",
    color: "#00dc82",
    role: "Real-World Market Data Feed",
    what: "30+ live binary questions fetched from gamma-api.polymarket.com. Politics, crypto, sports, geopolitics. Each question maps to an LMSR contract on-chain. Real events, fully on-chain settlement.",
    code: "GET /markets?active=true&closed=false\n{ question, outcomePrices: ['0.72','0.28'] }",
    bg: "var(--mint)",
  },
];

const contracts = [
  { name: "AquaParlayRouter", addr: "0x3617455115c85ab2bdb67c2dc8720d1d8afc0f76" },
  { name: "ParlayVault",      addr: "0x8d98ff91515b47f8a2b89d00cb597497dc47fbe0" },
  { name: "MarketResolver",   addr: "0x5d5cc1cd24943ecf43ad5e88281393418ca06bea" },
  { name: "LmsrMarket ×2",    addr: "0xdcd65f…7911d  ·  0x76048d…84aa" },
];

export default function Pitch() {
  return (
    <>
      {/* ══ PROBLEM: headline row ══ */}
      <section id="problem">
        <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
          <div
            className="gc-1-2 halftone-dark"
            style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
          />
          <div
            className="gc-3-4 flex flex-col justify-end cell-pad-lg"
            style={{ background: "var(--black)", minHeight: "clamp(200px, 28vh, 360px)" }}
          >
            <p className="text-label" style={{ color: "#555", marginBottom: 12 }}>■ The Problem</p>
            <h2 className="text-display text-white">The Gap</h2>
          </div>
        </div>

        {/* Problem stats — 4 big-number cells */}
        <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
          {problemStats.map((s) => (
            <div
              key={s.n}
              className="flex flex-col justify-between cell-pad"
              style={{ background: s.bg, color: s.color, minHeight: "clamp(160px, 22vh, 300px)" }}
            >
              <span
                style={{ fontSize: "clamp(44px, 7vw, 100px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}
              >
                {s.n}
              </span>
              <span className="text-label mt-4" style={{ opacity: 0.6 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Problem description row */}
        <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
          <div
            className="gc-1-2 flex flex-col justify-between cell-pad"
            style={{ background: "var(--white)", minHeight: "clamp(180px, 24vh, 340px)" }}
          >
            <p className="text-label mb-4">■ The untapped market</p>
            <p className="text-body" style={{ maxWidth: 420 }}>
              Parlays are 40% of every sportsbook's revenue — the highest-margin product in gambling.
              Yet no DeFi protocol has ever offered an on-chain parlay. Polymarket, Augur, Manifold —
              all single-outcome only. The parlay market is entirely unserved.
            </p>
          </div>
          <div
            className="gc-3-4 flex flex-col justify-between cell-pad"
            style={{ background: "var(--black)", minHeight: "clamp(180px, 24vh, 340px)" }}
          >
            <p className="text-label" style={{ color: "#555", marginBottom: 12 }}>■ What's broken</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["Single outcome only",   "1.4× max payout on any Polymarket bet."],
                ["Order books fail retail","No counterparty = no trade. Illiquid = no price."],
                ["Capital locked",        "AMM LPs must deposit 100% upfront. High risk, low efficiency."],
                ["15–30% house edge",     "Traditional parlays are opaque. Users pay huge fees."],
              ].map(([title, desc]) => (
                <div key={title}>
                  <p style={{ fontWeight: 700, fontSize: 12, color: "white", letterSpacing: "0.02em" }}>{title}</p>
                  <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ LMSR PRICING ══ */}
      <section id="lmsr">
        <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
          <div
            className="gc-1-2 flex flex-col justify-end cell-pad-lg"
            style={{ background: "var(--mint)", minHeight: "clamp(200px, 28vh, 360px)" }}
          >
            <p className="text-label" style={{ color: "var(--black)", opacity: 0.5, marginBottom: 12 }}>■ Pricing Engine</p>
            <h2 className="text-display" style={{ color: "var(--black)" }}>LMSR</h2>
          </div>
          <div
            className="gc-3-4 halftone"
            style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
          />
        </div>

        <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Formula cell */}
          <div
            className="gc-1-2 flex flex-col justify-between cell-pad"
            style={{ background: "var(--black)", minHeight: "clamp(200px, 28vh, 360px)" }}
          >
            <p className="text-label" style={{ color: "#555", marginBottom: 12 }}>■ Always-on liquidity</p>
            <div>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(13px, 1.6vw, 18px)", color: "var(--mint)", lineHeight: 2 }}>
                C(q) = b · ln( e^q₀/b + e^q₁/b )
                <br />
                price = e^(qᵢ/b) / Σ e^(qⱼ/b)
                <br />
                combined = p₁ × p₂ × … × pₙ
                <br />
                payout = stake ÷ combined
              </p>
              <p className="text-body text-white mt-6" style={{ opacity: 0.6, maxWidth: 380 }}>
                No counterparty needed. Formula is the market. Prices update automatically with every trade.
              </p>
            </div>
          </div>

          {/* LP risk cell */}
          <div
            className="gc-3 flex flex-col justify-between cell-pad"
            style={{ background: "var(--light-gray)", minHeight: "clamp(200px, 28vh, 360px)" }}
          >
            <p className="text-label" style={{ opacity: 0.5, marginBottom: 8 }}>■ LP max loss</p>
            <div>
              <span style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
                $69
              </span>
              <p className="text-label mt-3" style={{ opacity: 0.5 }}>b × ln(2) with b = 100 USDC</p>
              <p className="text-body mt-6" style={{ opacity: 0.7, maxWidth: 280 }}>
                LMSR caps LP downside. No matter how many users win, the LP can never lose more than b × ln(N).
              </p>
            </div>
          </div>

          {/* Win rate cell */}
          <div
            className="gc-4 flex flex-col justify-between cell-pad"
            style={{ background: "var(--mint)", minHeight: "clamp(200px, 28vh, 360px)" }}
          >
            <p className="text-label" style={{ opacity: 0.5, marginBottom: 8 }}>■ LP win rate</p>
            <div>
              <span style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: "var(--black)" }}>
                75%
              </span>
              <p className="text-label mt-3" style={{ opacity: 0.5 }}>of 2-leg parlays lose</p>
              <p className="text-body mt-6" style={{ opacity: 0.7, maxWidth: 280 }}>
                At 50/50 odds, only 25% of 2-leg parlays hit. LP keeps the stake on every miss — plus a pricing edge built into the formula.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SPONSOR TECH ══ */}
      <section id="sponsors">
        <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
          <div
            className="gc-1-2 halftone"
            style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
          />
          <div
            className="gc-3-4 flex flex-col justify-end cell-pad-lg"
            style={{ background: "var(--black)", minHeight: "clamp(200px, 28vh, 360px)" }}
          >
            <p className="text-label" style={{ color: "#555", marginBottom: 12 }}>■ Sponsor Integrations</p>
            <h2 className="text-display text-white">Stack</h2>
          </div>
        </div>

        {/* Sponsor cards — 2×2 */}
        <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
          {sponsors.map((s, i) => (
            <div
              key={s.name}
              className="flex flex-col justify-between cell-pad"
              style={{
                background: s.bg,
                color: s.bg === "var(--black)" ? "white" : "var(--black)",
                minHeight: "clamp(260px, 34vh, 460px)",
                gridColumn: i === 0 ? "1 / 3" : i === 1 ? "3 / 5" : i === 2 ? "1 / 3" : "3 / 5",
              }}
            >
              <div>
                <p className="text-label mb-3" style={{ opacity: 0.5 }}>{s.role}</p>
                <h3
                  style={{
                    fontSize: "clamp(22px, 3vw, 44px)",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.1,
                    color: s.color,
                  }}
                >
                  {s.name}
                </h3>
                <p
                  className="text-body mt-5"
                  style={{
                    opacity: 0.75,
                    maxWidth: 500,
                    color: s.bg === "var(--black)" ? "white" : "var(--black)",
                  }}
                >
                  {s.what}
                </p>
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  lineHeight: 1.9,
                  padding: "12px 16px",
                  marginTop: 16,
                  border: `1px solid ${s.color}22`,
                  background: s.bg === "var(--black)" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
                  color: s.color,
                  whiteSpace: "pre",
                }}
              >
                {s.code}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LIVE DEPLOYMENT ══ */}
      <section id="live">
        <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
          <div
            className="gc-1-2 flex flex-col justify-end cell-pad-lg"
            style={{ background: "var(--black)", minHeight: "clamp(200px, 28vh, 360px)" }}
          >
            <p className="text-label" style={{ color: "#555", marginBottom: 12 }}>■ Sepolia Testnet · Chain ID 11155111</p>
            <h2 className="text-display text-white">Live.</h2>
          </div>
          <div
            className="gc-3-4 halftone-dark"
            style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
          />
        </div>

        {/* Contracts + metrics */}
        <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Contract addresses */}
          <div
            className="gc-1-2 flex flex-col justify-between cell-pad"
            style={{ background: "var(--black)", minHeight: "clamp(220px, 30vh, 400px)" }}
          >
            <p className="text-label" style={{ color: "#555", marginBottom: 16 }}>■ Deployed Contracts</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {contracts.map((c, i) => (
                <div
                  key={c.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: i > 0 ? "1px solid #1a1a1a" : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555" }}>
                    {c.name}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "white" }}>{c.addr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live metrics */}
          <div
            className="gc-3 flex flex-col justify-between cell-pad"
            style={{ background: "var(--mint)", minHeight: "clamp(220px, 30vh, 400px)" }}
          >
            <p className="text-label" style={{ marginBottom: 8, opacity: 0.5 }}>■ Traction</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                ["5+",     "Parlay tickets minted on-chain"],
                ["$1945",  "USDC approved to Aqua (LP active)"],
                ["30+",    "Real Polymarket questions in UI"],
                ["4×",     "Payout on 2-leg 50/50 parlay"],
              ].map(([n, l]) => (
                <div key={n}>
                  <div style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--black)" }}>
                    {n}
                  </div>
                  <div className="text-label mt-1" style={{ opacity: 0.6 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ETHGlobal badge */}
          <div
            className="gc-4 flex flex-col justify-between cell-pad"
            style={{ background: "var(--white)", minHeight: "clamp(220px, 30vh, 400px)" }}
          >
            <p className="text-label" style={{ marginBottom: 8, opacity: 0.5 }}>■ Submission</p>
            <div>
              <p
                style={{
                  fontSize: "clamp(26px, 3.5vw, 48px)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  color: "var(--black)",
                }}
              >
                ETHGlobal<br />2026
              </p>
              <p className="text-body mt-6" style={{ opacity: 0.6, maxWidth: 240 }}>
                Built in 36 hours. Fully on-chain. 4 sponsor integrations. Contracts live on Sepolia.
              </p>
              <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Next.js 14", "wagmi v2", "Foundry", "Solidity", "viem"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      border: "1px solid var(--border)",
                      color: "var(--black)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
