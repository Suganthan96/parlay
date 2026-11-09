import TatumLogo from "./TatumLogo";
import WalrusLogo from "./WalrusLogo";

const stack = [
  { name: "Tatum RPC",       category: "Live Chain Data"         },
  { name: "Walrus Memory",   category: "Persistent Intelligence" },
  { name: "Walrus Blobs",    category: "NFT Metadata Store"      },
  { name: "Sui Move",        category: "Smart Contracts"         },
  { name: "Polymarket API",  category: "Market Data Feed"        },
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
          className="gc-3-4 halftone flex flex-col justify-end cell-pad-lg"
          style={{ minHeight: "clamp(280px, 38vh, 500px)" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <TatumLogo variant="dark" height={30} />
            <WalrusLogo color="#111111" height={24} />
          </div>
        </div>
      </div>

      {/* Row B: description + stack list */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
        {/* label + description */}
        <div
          className="gc-1-2 bg-white flex flex-col justify-between cell-pad"
          style={{ minHeight: "clamp(220px, 28vh, 400px)" }}
        >
          <div>
            <p className="text-label mb-6">Tatum × Walrus · Total Recall Hackathon · Track 1</p>
            <p className="text-body" style={{ maxWidth: 440 }}>
              Parlay Markets is a thin coordination layer on top of infrastructure
              that already exists. Tatum RPC powers every on-chain read — ticket
              state, treasury balance, live SUI price. Walrus Memory learns from
              every bet: market credibility scores update with each resolved outcome.
              No database, no server, no custodian.
            </p>
          </div>
        </div>

        {/* Stack list */}
        <div
          className="gc-3-4 bg-white"
          style={{ minHeight: "clamp(220px, 28vh, 400px)" }}
        >
          {stack.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center justify-between px-6 py-5"
              style={{
                borderBottom:
                  i < stack.length - 1 ? "1px solid var(--border)" : "none",
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
