import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { CommentSection } from '../components/CommentSection';
import { IconBack, IconCopy, IconEdit } from '../components/Icons';
import { QuoteCard, copyQuote, resolveAuthorForQuote } from '../components/QuoteCard';
import { useStore } from '../store/store';

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  const commentsRef = useRef<HTMLElement>(null);

  const quote = id ? store.getQuote(id) : undefined;

  useEffect(() => {
    if (window.location.hash === '#comments') {
      commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [id]);

  if (!quote) {
    return (
      <div className="page">
        <header className="page-header">
          <button type="button" className="icon-btn" onClick={() => navigate(-1)}><IconBack /></button>
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
  const interaction = store.getInteraction(quote.id);
  const comments = store.getComments(quote.id);
  const isEssay = quote.type === 'essay';
  const authorLink = isEssay ? '/me' : `/author/${author.id}`;

  const handleBack = () => {
    const fromPublish = (location.state as { fromPublish?: boolean } | null)?.fromPublish;
    if (isEssay && fromPublish) {
      navigate('/', { replace: true });
      return;
    }
    if (isEssay) {
      navigate('/me');
      return;
    }
    navigate(-1);
  };

  return (
    <div className="page page-detail">
      <header className="detail-header">
        <button type="button" className="icon-btn" onClick={handleBack} aria-label="返回"><IconBack /></button>
        <Avatar author={author} size={36} to={authorLink} />
        <div className="detail-header-meta">
          <Link to={authorLink}>{author.nameCn}</Link>
          {(quote.location || author.ip) && (
            <span>{quote.location || author.ip}</span>
          )}
        </div>
        <div className="detail-header-tools">
          <button type="button" className="icon-btn" onClick={() => navigate(`/add?edit=${quote.id}`)}>
            <IconEdit />
          </button>
          <button type="button" className="icon-btn" onClick={() => void copyQuote(quote, author)}>
            <IconCopy />
          </button>
        </div>
      </header>

      <main className="detail-main">
        <QuoteCard
          quote={quote}
          author={author}
          likes={interaction.likes}
          favorited={interaction.favorited}
          commentCount={comments.length}
          showActions={false}
          onLike={() => store.likeQuote(quote.id)}
          onFavorite={() => store.toggleFavorite(quote.id)}
          onCommentClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })}
          onCopy={() => void copyQuote(quote, author)}
        />

        {quote.supplement && <p className="detail-supplement">{quote.supplement}</p>}

        <section ref={commentsRef} id="comments">
          <CommentSection
            comments={comments}
            onAdd={(text) => store.addComment(quote.id, text)}
            onDelete={(cid) => store.deleteComment(quote.id, cid)}
            onLike={(cid) => store.likeComment(quote.id, cid)}
          />
        </section>
      </main>
    </div>
  );
}
