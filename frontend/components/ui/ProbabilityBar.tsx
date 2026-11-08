interface ProbabilityBarProps {
  pct:        number;
  showLabel?: boolean;
  label?:     string;
}

export function ProbabilityBar({ pct, showLabel, label }: ProbabilityBarProps) {
  const pctDisplay = `${(pct * 100).toFixed(0)}%`;
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{label ?? 'HOME'}</span>
          <span style={{ fontSize: 10, fontWeight: 700 }}>{pctDisplay}</span>
        </div>
      )}
      <div className="prob-bar">
        <div className="prob-bar-fill" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
