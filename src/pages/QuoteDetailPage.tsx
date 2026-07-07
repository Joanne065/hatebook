import { useLayoutEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { CommentSection } from '../components/CommentSection';
import { IconBack, IconCopy, IconEdit } from '../components/Icons';
import { QuoteCard, copyQuote, resolveAuthorForQuote } from '../components/QuoteCard';
import { useStore } from '../store/store';
import { shuffle } from '../utils/helpers';
import { goBack, readLocationState, type AppLocationState } from '../utils/navigation';

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  const commentsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const state = readLocationState(location.state);

  const quote = id ? store.getQuote(id) : undefined;

  useLayoutEffect(() => {
    if (window.location.hash === '#comments') {
      commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    window.scrollTo(0, 0);
    topRef.current?.scrollIntoView({ block: 'start' });
  }, [id]);

  const authorFeed = !!(state?.authorFeed && quote && quote.type === 'excerpt');

  const moreQuotes = useMemo(() => {
    if (!authorFeed || !quote) return [];
    const others = store.excerptQuotes.filter((q) => q.authorId === quote.authorId && q.id !== quote.id);
    return shuffle(others);
  }, [authorFeed, quote?.id, quote?.authorId, store.excerptQuotes]);

  if (!quote) {
    return (
      <div className="page">
        <header className="page-header">
          <button type="button" className="icon-btn" onClick={() => goBack(navigate, '/')}><IconBack /></button>
          <span>未找到</span>
        </header>
        <p className="empty">这条内容不存在或已被删除</p>
      </div>
    );
  }

  const author = resolveAuthorForQuote(
    store.getAuthor(quote.authorId),
    store.state.userProfile.name,
  );
  const isEssay = quote.type === 'essay';
  const authorLink = isEssay ? '/me' : `/author/${author.id}`;

  const authorPath = `/author/${author.id}`;
  const authorReturnState: AppLocationState = { backTo: state.restoreState?.backTo ?? '/' };

  const handleBack = () => {
    const openedFromAuthor =
      state.authorFeed ||
      state.backTo === authorPath ||
      (state.backTo?.startsWith('/author/') ?? false);

    if (openedFromAuthor && !isEssay) {
      goBack(navigate, authorPath, authorReturnState);
      return;
    }
    if (state.backTo) {
      goBack(navigate, state.backTo);
      return;
    }
    if (state.fromPublish) {
      goBack(navigate, isEssay ? '/me' : authorPath);
      return;
    }
    goBack(navigate, isEssay ? '/me' : '/');
  };

  const authorPageState: AppLocationState = authorReturnState;
  const feedLinkState: AppLocationState = {
    authorFeed: true,
    backTo: authorPath,
    restoreState: authorReturnState,
  };
  const editBackState: AppLocationState = {
    backTo: state.backTo ?? (authorFeed ? authorPath : isEssay ? '/me' : '/'),
    authorFeed,
    restoreState: authorReturnState,
  };

  const renderQuoteBlock = (q: typeof quote, opts: { showInput: boolean; anchorComments?: boolean; isPrimary?: boolean }) => {
    const qAuthor = resolveAuthorForQuote(
      store.getAuthor(q.authorId),
      store.state.userProfile.name,
    );
    const qInteraction = store.getInteraction(q.id);
    const qComments = store.getComments(q.id);
    const cardLinkState = authorFeed ? feedLinkState : undefined;

    return (
      <article className="detail-feed-item" key={q.id} ref={opts.isPrimary ? topRef : undefined}>
        <QuoteCard
          quote={q}
          author={qAuthor}
          likes={qInteraction.likes}
          favorited={qInteraction.favorited}
          commentCount={qComments.length}
          showActions={false}
          disablePaperLink={opts.isPrimary}
          linkState={cardLinkState}
          onLike={() => store.likeQuote(q.id)}
          onFavorite={() => store.toggleFavorite(q.id)}
          onCommentClick={() => {
            if (opts.anchorComments) commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          onCopy={() => void copyQuote(q, qAuthor)}
        />
        {q.supplement && <p className="detail-supplement">{q.supplement}</p>}
        {(opts.showInput || qComments.length > 0) && (
          <div className="detail-feed-comments" ref={opts.anchorComments ? commentsRef : undefined}>
            <CommentSection
              comments={qComments}
              onAdd={opts.showInput ? (text) => store.addComment(q.id, text) : undefined}
              onDelete={(cid) => store.deleteComment(q.id, cid)}
              onLike={(cid) => store.likeComment(q.id, cid)}
              readOnly={!opts.showInput}
            />
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="page page-detail">
      <header className="detail-header">
        <button type="button" className="icon-btn" onClick={handleBack} aria-label="返回"><IconBack /></button>
        <Avatar author={author} size={36} to={authorLink} linkState={authorPageState} />
        <div className="detail-header-meta">
          <Link to={authorLink} state={authorPageState}>{author.nameCn}</Link>
          {(quote.location || author.ip) && (
            <span>{quote.location || author.ip}</span>
          )}
        </div>
        <div className="detail-header-tools">
          <button type="button" className="icon-btn" onClick={() => navigate(`/add?edit=${quote.id}`, { state: editBackState })}>
            <IconEdit />
          </button>
          <button type="button" className="icon-btn" onClick={() => void copyQuote(quote, author)}>
            <IconCopy />
          </button>
        </div>
      </header>

      <main className="detail-main">
        {renderQuoteBlock(quote, { showInput: true, anchorComments: true, isPrimary: true })}
        {authorFeed && moreQuotes.map((q) => renderQuoteBlock(q, { showInput: false }))}
      </main>
    </div>
  );
}
