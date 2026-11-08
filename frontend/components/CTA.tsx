import AspenLogo from "./AspenLogo";

export default function CTA() {
  return (
    <section id="team" style={{ borderTop: "1px solid var(--border)" }}>
      {/* Halftone bg panel with logo watermark */}
      <div
        className="relative halftone flex items-center justify-center overflow-hidden"
        style={{ minHeight: "clamp(300px, 42vh, 580px)" }}
      >
        {/* Giant logo watermark */}
        <AspenLogo
          size={280}
          className="absolute opacity-20 text-gray-500"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" } as React.CSSProperties}
        />
      </div>

      {/* Text row: START | A | PARLAY — grid across 4 cols */}
      <div
        className="page-grid"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}
      >
        {(["Start", "A", "Parlay"] as const).map((word, i) => (
          <div
            key={word}
            className="flex items-center justify-start"
            style={{
              background: "var(--black)",
              gridColumn: i === 0 ? "1" : i === 1 ? "2" : "3",
              minHeight: "clamp(80px, 12vh, 160px)",
              paddingLeft: "clamp(16px, 2vw, 32px)",
            }}
          >
            <span
              style={{
                fontSize: "clamp(32px, 5.5vw, 90px)",
                fontWeight: 900,
                color: "white",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {word}
            </span>
          </div>
        ))}
        {/* Mint arrow cell */}
        <div
          className="gc-4 flex items-center justify-center"
          style={{
            background: "var(--mint)",
            minHeight: "clamp(80px, 12vh, 160px)",
          }}
        >
          <span
            style={{ fontSize: "clamp(28px, 4vw, 64px)", color: "var(--black)", fontWeight: 700 }}
          >
            →
          </span>
        </div>
      </div>

      {/* ETHGlobal row */}
      <div
        className="page-grid"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="gc-1-4 flex items-center"
          style={{
            background: "var(--black)",
            minHeight: "clamp(80px, 14vh, 180px)",
            paddingLeft: "clamp(16px, 2vw, 32px)",
          }}
        >
          <span
            style={{
              fontSize: "clamp(36px, 7vw, 110px)",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.035em",
              lineHeight: 1,
            }}
          >
            On&nbsp;Chain.
          </span>
        </div>
      </div>
    </section>
  );
}
