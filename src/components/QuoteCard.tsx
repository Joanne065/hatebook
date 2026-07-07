import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Author, Quote } from '../types';
import { PaperContent } from './AutoFitQuote';
import { Avatar } from './Avatar';
import { IconComment, IconCopy, IconHeart, IconStar } from './Icons';
import { formatCopyText, formatSource, getShortAuthorName, ME_AUTHOR_ID } from '../utils/helpers';

interface QuoteCardProps {
  quote: Quote;
  author: Author;
  likes: number;
  favorited: boolean;
  commentCount: number;
  showActions?: boolean;
  showTimestamp?: boolean;
  compact?: boolean;
  onLike: () => void;
  onFavorite: () => void;
  onCommentClick?: () => void;
  onCopy: () => void;
}

export function QuoteCard({
  quote,
  author,
  likes,
  favorited,
  commentCount,
  showActions = true,
  showTimestamp = false,
  compact = false,
  onLike,
  onFavorite,
  onCommentClick,
  onCopy,
}: QuoteCardProps) {
  const isEssay = quote.type === 'essay';
  const authorLink = isEssay ? '/me' : `/author/${author.id}`;

  return (
    <article className={`quote-card${compact ? ' quote-card--compact' : ''}`}>
      <header className="quote-card-header">
        <Avatar author={author} size={compact ? 36 : 42} to={authorLink} />
        <div className="quote-card-meta">
          <Link to={authorLink} className="author-name-cn">{author.nameCn || author.nameEn}</Link>
          {!isEssay && author.nameEn && <span className="author-name-en">{author.nameEn}</span>}
          {isEssay && quote.location && <span className="author-name-en">{quote.location}</span>}
        </div>
        {showActions && (
          <div className="quote-card-tools">
            <button type="button" className="icon-btn" onClick={onCopy} aria-label="复制">
              <IconCopy />
            </button>
          </div>
        )}
      </header>

      <Link to={`/quote/${quote.id}`} className="paper-link">
        <PaperContent
          text={quote.text}
          original={quote.original}
          originalLabel={quote.originalLabel}
          variant="feed"
        />
      </Link>

      <footer className="quote-card-footer">
        <div className="quote-card-source">
          {quote.source && <span>{formatSource(quote.source)}</span>}
        </div>
        <div className="quote-card-actions">
          <button type="button" className="action-btn" onClick={onLike} aria-label="点赞">
            <IconHeart filled={likes > 0} />
            {likes > 0 && <span className="action-count">{likes}</span>}
          </button>
          <button type="button" className="action-btn" onClick={onFavorite} aria-label="收藏">
            <IconStar filled={favorited} />
          </button>
          <button type="button" className="action-btn" onClick={onCommentClick} aria-label="评论">
            <IconComment />
            {commentCount > 0 && <span className="action-count">{commentCount}</span>}
          </button>
        </div>
      </footer>

      {showTimestamp && quote.note && (
        <p className="quote-card-note">{quote.note}</p>
      )}
    </article>
  );
}

function FitAuthorName({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(name);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      setDisplay(name);
      requestAnimationFrame(() => {
        if (!ref.current) return;
        if (ref.current.scrollWidth <= ref.current.clientWidth + 1) return;
        const short = getShortAuthorName(name);
        setDisplay(short !== name ? short : name);
      });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [name]);

  return <span ref={ref} className="grid-card-author-name">{display}</span>;
}

export function GridQuoteCard({
  quote,
  author,
  likes,
  to,
  showAuthor = false,
}: {
  quote: Quote;
  author: Author;
  likes: number;
  to: string;
  showAuthor?: boolean;
}) {
  return (
    <Link to={to} className="grid-card">
      <PaperContent
        text={quote.text}
        original={quote.original}
        originalLabel={quote.originalLabel}
        variant="grid"
      />
      <div className="grid-card-footer">
        {showAuthor ? (
          <div className="grid-card-author">
            <Avatar author={author} size={18} />
            <FitAuthorName name={author.nameCn || author.nameEn} />
          </div>
        ) : (
          <span className="grid-card-source">{formatSource(quote.source)}</span>
        )}
        <span className="grid-card-likes">
          <IconHeart filled={likes > 0} size={14} />
          {likes > 0 && likes}
        </span>
      </div>
    </Link>
  );
}

export async function copyQuote(quote: Quote, author: Author) {
  const name = quote.type === 'essay' ? author.nameCn : getShortAuthorName(author.nameCn);
  const text = formatCopyText(quote.text, name);
  await navigator.clipboard.writeText(text);
}
export function resolveAuthorForQuote(author: Author | undefined, userName: string): Author {
  if (author) return author;
  return { id: ME_AUTHOR_ID, nameCn: userName, nameEn: userName };
}
