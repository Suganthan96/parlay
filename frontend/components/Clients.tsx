const sponsors = [
  { name: "1inch Aqua",     category: "Liquidity Layer"       },
  { name: "SwapVM",         category: "Pricing Execution"     },
  { name: "Chainlink CRE",  category: "Result Oracle"         },
  { name: "ParlayRouter",   category: "Smart Contract"        },
  { name: "ParlayVault",    category: "Settlement"            },
];

export default function Clients() {
  return (
    <section id="built-on">
      {/* Row A: "Built On" header */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
        <div
          className="gc-1-2 bg-white flex flex-col justify-end cell-pad-lg"
          style={{ minHeight: "clamp(280px, 38vh, 500px)" }}
        >
          <h2 className="text-display text-charcoal">Built On</h2>
        </div>
        <div
          className="gc-3-4 halftone"
          style={{ minHeight: "clamp(280px, 38vh, 500px)" }}
        />
      </div>

      {/* Row B: description + sponsor list */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
        {/* label + description */}
        <div
          className="gc-1-2 bg-white flex flex-col justify-between cell-pad"
          style={{ minHeight: "clamp(220px, 28vh, 400px)" }}
        >
          <div>
            <p className="text-label mb-6">Two open protocols, composable on-chain</p>
            <p className="text-body" style={{ maxWidth: 440 }}>
              Parlay Markets is a thin coordination layer on top of infrastructure
              that already exists. 1inch Aqua holds the liquidity and prices every
              outcome via LMSR. Chainlink CRE pushes verified results on-chain the
              moment a game ends. No database, no server.
            </p>
          </div>
        </div>

        {/* Sponsor list — same layout as original client list */}
        <div
          className="gc-3-4 bg-white"
          style={{ minHeight: "clamp(220px, 28vh, 400px)" }}
        >
          {sponsors.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center justify-between px-6 py-5"
              style={{
                borderBottom:
                  i < sponsors.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(18px, 2.5vw, 36px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {s.name}
              </span>
              <span className="text-label opacity-50">{s.category}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
