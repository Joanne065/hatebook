import type { ReactNode } from 'react';

export function BatchSelectWrap({
  batchMode,
  selected,
  onToggle,
  children,
}: {
  batchMode: boolean;
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  if (!batchMode) return <>{children}</>;

  return (
    <div className={`masonry-item-wrap batch-active${selected ? ' is-selected' : ''}`} onClick={onToggle}>
      <span className={`batch-check${selected ? ' checked' : ''}`} aria-hidden>
        {selected ? '✓' : ''}
      </span>
      {children}
    </div>
  );
}
