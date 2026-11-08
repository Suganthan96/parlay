import clsx from 'clsx';

type Status = 'won' | 'live' | 'lost' | 'pending';

const ICON: Record<Status, string> = {
  won:     '✓',
  lost:    '✕',
  live:    '●',
  pending: '◌',
};

export function LegPill({ label, status, price }: { label: string; status: Status; price?: number }) {
  return (
    <span className={clsx('leg-pill', {
      'leg-pill-won':  status === 'won',
      'leg-pill-live': status === 'live',
      'leg-pill-lost': status === 'lost',
    })} title={price !== undefined ? `Price: ${price.toFixed(2)}` : undefined}>
      {ICON[status]} {label}{price !== undefined ? ` · ${price.toFixed(2)}` : ''}
    </span>
  );
}
