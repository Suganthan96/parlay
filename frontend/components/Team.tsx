const stack = [
  {
    name: "1inch Aqua",
    role: "Liquidity & Pricing Infrastructure",
    bio: "Non-custodial liquidity pools where the LP's USDC never leaves their wallet. The SwapVM engine executes ParlayPrice instructions that read live LMSR balances from each match strategy to price every leg.",
    bg: "var(--white)",
  },
  {
    name: "Chainlink CRE",
    role: "Automated Result Oracle",
    bio: "Chainlink Automation monitors match results and pushes verified outcomes on-chain the moment a game ends. Cryptographically tamper-proof. Zero manual intervention from the protocol team.",
    bg: "var(--mint)",
  },
  {
    name: "SwapVM",
    role: "Parlay Pricing Engine",
    bio: "The ParlayPrice instruction multiplies LMSR outcome probabilities across all selected legs: p_i = e^(q_i/b) / Σ e^(q_j/b). The product of all leg prices plus a 10% margin gives the final ticket price.",
    bg: "var(--black)",
  },
];

export default function Team() {
  return (
    <section id="protocol">
      {/* Header row */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
        <div
          className="gc-1-2 bg-white flex flex-col justify-end cell-pad-lg"
          style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
        >
          <h2 className="text-display text-charcoal">Protocol</h2>
        </div>
        <div
          className="gc-3-4 halftone"
          style={{ minHeight: "clamp(200px, 28vh, 360px)" }}
        />
      </div>

      {/* Protocol stack grid — same 2×2 layout */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
        {stack.map((item, i) => (
          <div
            key={item.name}
            className="flex flex-col justify-between cell-pad"
            style={{
              background: item.bg,
              color: item.bg === "var(--black)" ? "white" : "var(--black)",
              minHeight: "clamp(220px, 30vh, 400px)",
              gridColumn: i === 0 ? "1 / 3" : i === 1 ? "3 / 5" : i === 2 ? "1 / 3" : "3 / 5",
            }}
          >
            <div>
              <p
                className="text-label mb-5"
                style={{ opacity: item.bg === "var(--black)" ? 0.6 : 0.5 }}
              >
                {item.role}
              </p>
              <h3
                style={{
                  fontSize: "clamp(22px, 3vw, 44px)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                }}
              >
                {item.name}
              </h3>
            </div>
            <p
              className="text-body mt-6"
              style={{ opacity: 0.75, maxWidth: 380 }}
            >
              {item.bio}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
