import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const MAX_FS_FEED = 28;
const MIN_FS_FEED = 24;
const MAX_FS_GRID = 15;
const MIN_FS_GRID = 12;

type PaperRatio = 'square' | '3x4' | '9x16';

const RATIO_ORDER: PaperRatio[] = ['square', '3x4', '9x16'];

function getInitialRatio(text: string, hasOriginal: boolean): PaperRatio {
  if (hasOriginal) return '3x4';
  if (text.length > 55) return '3x4';
  return 'square';
}

function nextRatio(ratio: PaperRatio): PaperRatio | null {
  const i = RATIO_ORDER.indexOf(ratio);
  return i < RATIO_ORDER.length - 1 ? RATIO_ORDER[i + 1] : null;
}

function ratioHeight(w: number, ratio: PaperRatio): number {
  if (ratio === 'square') return w;
  if (ratio === '3x4') return Math.round((w * 4) / 3);
  return Math.round((w * 16) / 9);
}

function lastLineLooksOrphaned(el: HTMLElement): boolean {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = Array.from(range.getClientRects());
  if (rects.length < 2) return false;
  const lastTop = rects[rects.length - 1].top;
  const lastLine = rects.filter((r) => Math.abs(r.top - lastTop) < 2);
  const em = parseFloat(getComputedStyle(el).fontSize);
  const lastWidth = lastLine.reduce((s, r) => s + r.width, 0);
  return lastWidth <= em * 2.2;
}

function fitAtRatio(
  inner: HTMLElement,
  textEl: HTMLElement,
  w: number,
  ratio: PaperRatio,
  pad: number,
  maxFs: number,
  minFs: number,
): { fits: boolean; targetH: number } {
  const targetH = ratioHeight(w, ratio);
  let fs = maxFs;
  textEl.style.fontSize = `${fs}px`;
  inner.style.minHeight = `${targetH - pad}px`;

  const contentH = () => inner.scrollHeight + pad;

  while (fs > minFs && contentH() > targetH + 2) {
    fs -= 1;
    textEl.style.fontSize = `${fs}px`;
  }

  while (fs > minFs && lastLineLooksOrphaned(textEl)) {
    fs -= 1;
    textEl.style.fontSize = `${fs}px`;
  }

  return { fits: contentH() <= targetH + 2, targetH };
}

function measurePaper(
  paper: HTMLElement,
  inner: HTMLElement,
  textEl: HTMLElement,
  text: string,
  variant: 'feed' | 'grid',
  hasOriginal: boolean,
) {
  const w = paper.clientWidth || paper.offsetWidth;
  if (!w) return;

  const maxFs = variant === 'feed' ? MAX_FS_FEED : MAX_FS_GRID;
  const minFs = variant === 'feed' ? MIN_FS_FEED : MIN_FS_GRID;
  const pad = variant === 'feed' ? 40 : 26;

  inner.style.minHeight = '0';
  paper.style.minHeight = '0';

  let ratio = getInitialRatio(text, hasOriginal);
  let { fits, targetH } = fitAtRatio(inner, textEl, w, ratio, pad, maxFs, minFs);

  while (!fits) {
    const upgraded = nextRatio(ratio);
    if (!upgraded) break;
    ratio = upgraded;
    ({ fits, targetH } = fitAtRatio(inner, textEl, w, ratio, pad, maxFs, minFs));
  }

  paper.style.minHeight = `${targetH}px`;
  const natural = inner.scrollHeight + pad;
  if (natural > targetH) {
    paper.style.minHeight = `${natural}px`;
  }
}

interface PaperContentProps {
  text: string;
  original?: string;
  originalLabel?: string;
  variant?: 'feed' | 'grid';
  className?: string;
  children?: ReactNode;
}

export function PaperContent({
  text,
  original,
  originalLabel,
  variant = 'feed',
  className = '',
  children,
}: PaperContentProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [, bump] = useState(0);

  useLayoutEffect(() => {
    const paper = paperRef.current;
    const inner = innerRef.current;
    const textEl = textRef.current;
    if (!paper || !inner || !textEl) return;

    measurePaper(paper, inner, textEl, text, variant, !!original);

    const ro = new ResizeObserver(() => {
      measurePaper(paper, inner, textEl, text, variant, !!original);
      bump((n) => n + 1);
    });
    ro.observe(paper);
    return () => ro.disconnect();
  }, [text, variant, original]);

  const quoteClass = variant === 'feed' ? 'paper-quote' : 'grid-card-text';
  const origClass = variant === 'feed' ? 'paper-original' : 'grid-card-original';

  return (
    <div ref={paperRef} className={`paper-surface paper-surface--${variant} ${className}`}>
      <div ref={innerRef} className="paper-inner">
        <div className="paper-text-block">
          <p ref={textRef} className={quoteClass}>{text}</p>
          {original && (
            <p className={origClass}>
              {originalLabel ? `${originalLabel}原文：` : variant === 'feed' ? '原文：' : ''}
              {original}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
