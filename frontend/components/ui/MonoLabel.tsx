import { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

export function MonoLabel({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span className={clsx('mono mono-label', className)} style={style}>{children}</span>
  );
}
