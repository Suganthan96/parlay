export default function Stats() {
  return (
    <section id="about">
      {/* Row 1 */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
        {/* 3 — protocols */}
        <div
          className="gc-1-2 flex flex-col justify-between cell-pad"
          style={{ background: "var(--white)", minHeight: "clamp(140px, 20vh, 260px)" }}
        >
          <span className="text-stat">2</span>
          <span className="text-label opacity-70 mt-4">Protocols — 1inch Aqua · Chainlink CRE</span>
        </div>
        {/* 5 — max legs */}
        <div
          className="gc-3 flex flex-col justify-between cell-pad"
          style={{ background: "var(--black)", minHeight: "clamp(140px, 20vh, 260px)" }}
        >
          <span className="text-stat text-white">5</span>
          <span className="text-label text-white opacity-70 mt-4">
            Max legs per parlay ticket
          </span>
        </div>
        {/* 1tx — buy flow */}
        <div
          className="gc-4 flex flex-col justify-between cell-pad"
          style={{ background: "var(--mint)", minHeight: "clamp(140px, 20vh, 260px)" }}
        >
          <span className="text-stat">1tx</span>
          <span className="text-label opacity-70 mt-4">To buy any parlay — stake, ticket, done</span>
        </div>
      </div>

      {/* Row 2 */}
      <div className="page-grid" style={{ borderTop: "1px solid var(--border)" }}>
        {/* 100% — odds always sum */}
        <div
          className="gc-1-2 flex flex-col justify-between cell-pad"
          style={{ background: "var(--mint)", minHeight: "clamp(160px, 22vh, 280px)" }}
        >
          <span className="text-stat" style={{ color: "var(--black)" }}>100%</span>
          <span className="text-label opacity-70 mt-4">Odds always sum to 100% — LMSR</span>
        </div>
        {/* DON — consensus nodes */}
        <div
          className="gc-3 flex flex-col justify-between cell-pad"
          style={{ background: "var(--black)", minHeight: "clamp(160px, 22vh, 280px)" }}
        >
          <span className="text-stat text-white">DON</span>
          <span className="text-label text-white opacity-70 mt-4">Chainlink node consensus — no single oracle</span>
        </div>
        {/* 0 — custodians */}
        <div
          className="gc-4 flex flex-col justify-between cell-pad"
          style={{ background: "var(--light-gray)", minHeight: "clamp(160px, 22vh, 280px)" }}
        >
          <span className="text-stat" style={{ color: "var(--black)" }}>0</span>
          <span className="text-label opacity-70 mt-4">
            Custodians — LP stays in your wallet
          </span>
        </div>
      </div>
    </section>
  );
}
