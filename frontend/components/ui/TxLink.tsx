const EXPLORER = 'https://sepolia.etherscan.io';

export function TxLink({ hash }: { hash: string }) {
  const short = `${hash.slice(0, 6)}…${hash.slice(-4)}`;
  return (
    <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
      className="mono underline" style={{ fontSize: 10 }}>
      TX {short}
    </a>
  );
}

export function AddrLink({ address, label }: { address: string; label?: string }) {
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  return (
    <a href={`${EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer"
      className="mono underline" style={{ fontSize: 10 }}>
      {label ?? short}
    </a>
  );
}
