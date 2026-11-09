import type { ReactNode } from 'react';
import { DAppNav } from '@/components/DAppNav';

export default function DAppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DAppNav />
      <main style={{ background: '#EFEDE8', minHeight: '100vh' }}>{children}</main>
      <footer style={{ borderTop: '1px solid var(--app-border)', background: 'var(--white)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px 24px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
          <p className="text-label" style={{ color: '#888', fontSize: 10 }}>
            TATUM × WALRUS · TOTAL RECALL HACKATHON · BUILT ON SUI · TATUM RPC · WALRUS MEMORY
          </p>
        </div>
      </footer>
    </>
  );
}
