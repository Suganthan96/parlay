const steps = [
  {
    quote:
      "Pick up to 5 live outcomes across sports, politics, or crypto. Each leg is a single prediction. Tatum RPC fetches the latest market state from Sui Mainnet in real time — treasury balance, ticket objects, live SUI price.",
    name: "Step 01 — Pick Your Legs",
    firm: "Tatum RPC · Polymarket API",
    bg: "var(--black)",
    color: "white",
  },
  {
    quote:
      "LMSR pricing multiplies outcome probabilities across all your legs. The combined price is set before you sign — no slippage, no hidden fees. Walrus Memory recalls past market credibility to surface the most reliable predictions.",
    name: "Step 02 — LMSR Prices It",
    firm: "Walrus Memory · LMSR Formula",
    bg: "var(--mint)",
    color: "var(--black)",
  },
  {
    quote:
      "One transaction on Sui Mainnet. Your stake flows into the ParlayVault, minting a single NFT ticket. The ticket metadata — all your legs, your stake, the payout — is stored on Walrus Blobs and anchored on-chain.",
    name: "Step 03 — One Ticket, On-Chain",
    firm: "Sui Move · Walrus Blobs",
    bg: "var(--light-gray)",
    color: "var(--black)",
  },
  {
    quote:
      "When a market resolves, the outcome is stored in Walrus Memory — building a credibility score for that market over time. Winning tickets unlock payouts from the on-chain treasury. The app gets smarter with every result.",
    name: "Step 04 — Walrus Remembers",
    firm: "Walrus Memory · ParlayVault",
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

      {/* Process step grid */}
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
