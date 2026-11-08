import React from "react";

// "P" built from 3 horizontal bars = 3 legs of a parlay
export default function AspenLogo({
  className = "",
  size = 36,
  style,
}: {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-label="Parlay Markets"
    >
      {/* Top bar — leg 1 */}
      <rect x="6" y="6"  width="36" height="8" fill="currentColor" />
      {/* Middle bar — leg 2 (shorter, like P crossbar) */}
      <rect x="6" y="20" width="24" height="8" fill="currentColor" />
      {/* Bottom bar — leg 3 */}
      <rect x="6" y="34" width="36" height="8" fill="currentColor" />
    </svg>
  );
}
