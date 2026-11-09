import TatumLogo from "./TatumLogo";
import WalrusLogo from "./WalrusLogo";

const problemStats = [
  { n: "$83B",  label: "Global sports betting market",        bg: "var(--black)",      color: "white"           },
  { n: "40%",   label: "Sportsbook revenue from parlays",     bg: "var(--light-gray)", color: "var(--black)"    },
  { n: "$1B+",  label: "Polymarket volume in 2024",           bg: "var(--mint)",       color: "var(--black)"    },
  { n: "0",     label: "On-chain parlay products today",      bg: "var(--white)",      color: "var(--black)"    },
];

const sponsors = [
  {
    name: "Tatum RPC",
    color: "#6366f1",
    role: "Live On-Chain Data",
    what: "All Sui chain reads route through Tatum's mainnet gRPC endpoint. Ticket objects, treasury balance, owned NFTs, live SUI price — Tatum powers every on-chain data call in the dApp. Zero self-hosting required.",
    code: "// SuiGrpcClient via Tatum mainnet\nawait client.listOwnedObjects(address)\nawait client.getObject(treasuryId)\nawait client.getLatestCheckpointSequenceNumber()",
    bg: "var(--black)",
  },
  {
    name: "Walrus Memory",
    color: "#10b981",
    role: "Persistent Intelligence Layer",
    what: "MemWal SDK remembers every bet. When a market resolves, the result + credibility score is stored as a Walrus memory. recall() surfaces the most accurate markets for future parlays. 10+ memories on-chain.",
    code: "// MemWal SDK\nawait memwal.remember({ market, outcome, score })\nconst memories = await memwal.recall({ query })\n// credibility grows with every result",
    bg: "var(--white)",
  },
  {
    name: "Walrus Blobs",
    color: "#f59e0b",
    role: "NFT Metadata Store",
    what: "Every ticket NFT's metadata is stored on Walrus Blob storage — legs, stake, payout, timestamp. The blobId is anchored on-chain in the ticket object. Fully decentralised, verifiable, permanent.",
    code: "// storeTicketMeta → Walrus testnet publisher\nPOST /v1/blobs { legs, stake, txHash }\n{ blobId } → stored in Ticket.blob_id\nGET /v1/blobs/{blobId} → recover metadata",
    bg: "var(--mint)",
  },
];

const contracts = [
  { name: "ParlayVault",   addr: "0x9706b4bf932a2e4e27e858ea562262abe001db18121c0fd3afc6f16537f8de1d" },
  { name: "Treasury",      addr: "0xac9d1b3282e65b9ab1c185ac5a825458a357eaaba4b546808e66e7873110e684" },
  { name: "Market: MCvARS",addr: "0xee6bca2cf833139daba5e2041ad205e2f91590219690d933b5dc74a0168e117a" },
  { name: "Market: RMvLFC",addr: "0xacb7bb61447eca9538e4676ec462e5031b5101ac4788a7de7ddefddfc3548b6f" },
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
                ["No chain memory",       "Past market accuracy is never recorded or used."],
                ["Capital locked",        "AMM LPs must deposit 100% upfront. High risk."],
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

      {/* ══ TECH INTEGRATIONS ══ */}
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
            <p className="text-label" style={{ color: "#555", marginBottom: 12 }}>■ Hackathon Integrations</p>
            <h2 className="text-display text-white">Stack</h2>
          </div>
        </div>

        {/* Integration cards — 3 cards */}
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
                {s.name === "Tatum RPC" && (
                  <TatumLogo variant="light" height={36} />
                )}
                {s.name === "Walrus Memory" && (
                  <WalrusLogo color="#111111" height={28} />
                )}
                {s.name === "Walrus Blobs" && (
                  <WalrusLogo color="#111111" height={28} />
                )}
                {!["Tatum RPC", "Walrus Memory", "Walrus Blobs"].includes(s.name) && (
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
                )}
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
            <p className="text-label" style={{ color: "#555", marginBottom: 12 }}>■ Sui Mainnet · Chain ID sui:mainnet</p>
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
            <p className="text-label" style={{ color: "#555", marginBottom: 16 }}>■ Deployed Contracts — Sui Mainnet</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {contracts.map((c, i) => (
                <div
                  key={c.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: i > 0 ? "1px solid #1a1a1a" : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555" }}>
                    {c.name}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "white", wordBreak: "break-all" }}>{c.addr}</span>
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
                ["10+",    "Parlay tickets minted on Sui Mainnet"],
                ["10+",    "Walrus Memory entries stored"],
                ["3 SUI",  "Treasury funded, live payouts"],
                ["4×",     "Payout on 2-leg 50/50 parlay"],
              ].map(([n, l]) => (
                <div key={n + l}>
                  <div style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--black)" }}>
                    {n}
                  </div>
                  <div className="text-label mt-1" style={{ opacity: 0.6 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hackathon submission badge */}
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
                Tatum<br />× Walrus
              </p>
              <p className="text-body mt-4" style={{ opacity: 0.6, maxWidth: 240 }}>
                Total Recall Hackathon · Track 1 · Markets & Sports Prediction. Live on Sui Mainnet. 10+ Walrus memories.
              </p>
              <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Next.js 14", "Sui Move", "Tatum RPC", "Walrus Memory", "Walrus Blobs", "Polymarket"].map((t) => (
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
