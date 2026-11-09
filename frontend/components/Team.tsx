import TatumLogo from "./TatumLogo";
import WalrusLogo from "./WalrusLogo";

const stack = [
  {
    name: "Tatum RPC",
    role: "Live On-Chain Data Layer",
    bio: "Every Sui chain read goes through Tatum — ticket lookups, treasury balance, SUI price, owned objects. Tatum's mainnet gRPC endpoint powers the BCS-decoded ticket list and the live market state shown in the UI.",
    bg: "var(--white)",
  },
  {
    name: "Walrus Memory",
    role: "Persistent Intelligence Layer",
    bio: "MemWal SDK stores every bet resolution as a memory: market name, outcome, and credibility score. As more games resolve, recall() surfaces the most accurate markets. The app learns from history.",
    bg: "var(--mint)",
  },
  {
    name: "Sui Move",
    role: "Smart Contract Settlement",
    bio: "ParlayVault mints an NFT ticket in a single transaction. The LMSR pricing formula runs on-chain. When a market resolves, winners claim payouts directly from the vault — no intermediary, no server.",
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

      {/* Protocol stack grid */}
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
              {item.name === "Tatum RPC" && (
                <TatumLogo variant="dark" height={36} />
              )}
              {item.name === "Walrus Memory" && (
                <WalrusLogo color="var(--black)" height={28} />
              )}
              {item.name !== "Tatum RPC" && item.name !== "Walrus Memory" && (
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
              )}
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
