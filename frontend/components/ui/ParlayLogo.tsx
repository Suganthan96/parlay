// "P" built from 3 stacked bars (3 legs of a parlay)
export function ParlayLogo({ size = 28 }: { size?: number }) {
  const bar = size * 0.18;
  const gap = size * 0.07;
  const w   = size * 0.55;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-label="Parlay Markets">
      {/* 3 horizontal bars stacked = "P" glyph */}
      <rect x="4" y="4"  width="20" height={5} fill="currentColor" />
      <rect x="4" y="12" width="14" height={5} fill="currentColor" />
      <rect x="4" y="20" width="20" height={5} fill="currentColor" />
    </svg>
  );
}
