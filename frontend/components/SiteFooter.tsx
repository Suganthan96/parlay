export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 24px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        <p className="mono" style={{ color: '#888', fontSize: 10 }}>
          ■ TATUM × WALRUS · TOTAL RECALL HACKATHON · BUILT ON SUI · TATUM RPC · WALRUS MEMORY
        </p>
      </div>
    </footer>
  );
}
