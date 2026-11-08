export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 24px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        <p className="mono" style={{ color: '#888', fontSize: 10 }}>
          ■ HACKATHON PROTOTYPE · TESTNET/FORK ONLY · BUILT ON 1INCH AQUA · SETTLED BY CHAINLINK CRE
        </p>
      </div>
    </footer>
  );
}
