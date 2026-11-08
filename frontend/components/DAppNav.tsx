'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentAccount, useConnectWallet, useDisconnectWallet, useWallets, useSuiClientContext } from '@mysten/dapp-kit';
import AspenLogo from './AspenLogo';
import { useSuiBalance } from '@/lib/hooks';
import { useParlayStore } from '@/lib/store';
import type { Network } from '@/lib/sui-client';

const NAV = [
  { label: 'Markets', href: '/markets' },
  { label: 'Parlay',  href: '/parlay'  },
  { label: 'Tickets', href: '/tickets' },
  { label: 'LP',      href: '/lp'      },
];

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const t = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      });
      setTime(`${t} IST`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-label" style={{ fontSize: 10 }}>{time}</span>;
}

function NetworkToggle() {
  const ctx     = useSuiClientContext();
  const network = ctx.network as Network;
  const isTestnet = network === 'testnet';

  return (
    <button
      onClick={() => ctx.selectNetwork(isTestnet ? 'mainnet' : 'testnet')}
      title={`Currently on ${network} — click to switch`}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 14px', height: '100%',
        background: isTestnet ? '#7c3aed' : '#059669',
        color: '#fff', border: 'none', cursor: 'pointer',
        fontWeight: 800, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
        whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{ fontSize: 7, opacity: 0.7 }}>⬤</span>
      {isTestnet ? 'TESTNET' : 'MAINNET'}
      <span style={{ opacity: 0.5, fontSize: 8 }}>⇄</span>
    </button>
  );
}

function WalletButton() {
  const account             = useCurrentAccount();
  const wallets             = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const isConnected         = !!account;
  const { formatted: sui }  = useSuiBalance();

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <NetworkToggle />
        <button
          onClick={() => wallets.length > 0 && connect({ wallet: wallets[0] })}
          style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '100%', background: 'var(--black)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
        >
          CONNECT →
        </button>
      </div>
    );
  }

  const addr = account.address;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <NetworkToggle />

      {/* Wallet info */}
      <button
        onClick={() => disconnect()}
        title="Click to disconnect"
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: '100%', background: 'var(--black)', color: 'var(--white)', border: 'none', cursor: 'pointer', textAlign: 'left', borderRight: '1px solid #333' }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="text-label" style={{ fontSize: 9, color: '#888' }}>
            ■ SUI WALLET
          </span>
          <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: '-0.01em' }}>
            {sui} SUI
          </span>
        </span>
        <span className="text-label" style={{ fontSize: 9, color: '#555' }}>
          {addr.slice(0, 6)}…{addr.slice(-4)}
        </span>
      </button>
    </div>
  );
}

export function DAppNav() {
  const path            = usePathname();
  const legCount        = useParlayStore(s => s.legs.length);
  const ticketMetaCount = useParlayStore(s => Object.keys(s.ticketMeta).length);

  return (
    <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        className="hidden md:grid"
        style={{ maxWidth: 1440, margin: '0 auto', gridTemplateColumns: 'auto auto 1fr auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', height: 56, borderRight: '1px solid var(--border)', textDecoration: 'none', color: 'var(--black)' }}
        >
          <AspenLogo size={18} />
          <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.06em' }}>PARLAY</span>
        </Link>

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderRight: '1px solid var(--border)' }}>
          <LiveClock />
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex' }}>
          {NAV.map(n => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '0 20px', height: 56,
                  borderRight: '1px solid var(--border)',
                  textDecoration: 'none', fontWeight: 600, fontSize: 11,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color:      active ? 'var(--white)' : 'var(--black)',
                  background: active ? 'var(--black)' : 'transparent',
                }}
              >
                {n.label}
                {n.href === '/parlay' && legCount > 0 && (
                  <span style={{ marginLeft: 6, background: 'var(--mint)', color: 'var(--black)', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 2 }}>
                    {legCount}
                  </span>
                )}
                {n.href === '/tickets' && ticketMetaCount > 0 && (
                  <span style={{ marginLeft: 6, background: '#6366f1', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 2 }}>
                    {ticketMetaCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Wallet + Network toggle */}
        <WalletButton />
      </div>
    </header>
  );
}
