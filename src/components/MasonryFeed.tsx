import { Children, type ReactNode } from 'react';

export function MasonryFeed({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const left: ReactNode[] = [];
  const right: ReactNode[] = [];

  items.forEach((child, index) => {
    if (index % 2 === 0) left.push(child);
    else right.push(child);
  });

  return (
    <div className="masonry-feed">
      <div className="masonry-col">{left}</div>
      <div className="masonry-col">{right}</div>
    </div>
  );
}
