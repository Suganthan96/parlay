const steps = [
  {
    quote:
      "Pick up to 5 live outcomes across any sport. Each leg is a single prediction — one team wins, one event resolves. Prices update every 4 seconds from 1inch Aqua's live LMSR pool.",
    name: "Step 01 — Pick Your Legs",
    firm: "1inch Aqua · LMSR Pricing",
    bg: "var(--black)",
    color: "white",
  },
  {
    quote:
      "SwapVM's ParlayPrice instruction multiplies the LMSR outcome probabilities across all your legs. The contract reads live q_i/b balances and shows you exactly what you pay before you sign anything.",
    name: "Step 02 — Aqua Prices It",
    firm: "SwapVM · ParlayPrice Instruction",
    bg: "var(--mint)",
    color: "var(--black)",
  },
  {
    quote:
      "One transaction. Your stake flows through ParlayRouter into ParlayVault, minting a single on-chain ticket. LP liquidity never moves — it stays in the LP's wallet via Aqua's non-custodial model.",
    name: "Step 03 — One Ticket, On-Chain",
    firm: "ParlayRouter · ParlayVault",
    bg: "var(--light-gray)",
    color: "var(--black)",
  },
  {
    quote:
      "Chainlink Automation pushes verified match results on-chain the moment a game ends. Winning tickets unlock instant payouts. Losing tickets free LP capital immediately. No manual intervention.",
    name: "Step 04 — Chainlink Settles",
    firm: "Chainlink CRE · Automation",
    bg: "var(--white)",
    color: "var(--black)",
  },
];

export default function Testimonials() {
  return (
    <section id="how-it-works">
      {/* Header row */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
        <div
          className="gc-1-2 halftone"
          style={{ minHeight: "clamp(200px, 28vh, 380px)" }}
        />
        <div
          className="gc-3-4 bg-white flex flex-col justify-end cell-pad-lg"
          style={{ minHeight: "clamp(200px, 28vh, 380px)" }}
        >
          <h2 className="text-display text-charcoal">Process</h2>
        </div>
      </div>

      {/* Process step grid — same 4-cell layout as testimonials */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
        {steps.map((t, i) => (
          <div
            key={i}
            className="flex flex-col justify-between cell-pad"
            style={{
              background: t.bg,
              color: t.color,
              minHeight: "clamp(200px, 28vh, 360px)",
              gridColumn: i === 0 ? "1 / 3" : i === 1 ? "3 / 5" : i === 2 ? "1 / 3" : "3 / 5",
            }}
          >
            <blockquote
              style={{
                fontSize: "clamp(16px, 1.6vw, 24px)",
                fontWeight: 500,
                lineHeight: 1.45,
                letterSpacing: "-0.01em",
              }}
            >
              {t.quote}
            </blockquote>
            <div className="mt-8">
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-label opacity-60 mt-1">{t.firm}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
