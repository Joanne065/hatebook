import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav, HOME_REFRESH_EVENT, SearchBar } from '../components/Layout';
import { QuoteCard, copyQuote, resolveAuthorForQuote } from '../components/QuoteCard';
import { searchQuotes, useStore } from '../store/store';
import { shuffle } from '../utils/helpers';
import type { Quote } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  const store = useStore();
  const [query, setQuery] = useState('');
  const [feedOrder, setFeedOrder] = useState(() => shuffle(store.excerptQuotes.map((q) => q.id)));

  useEffect(() => {
    const onRefresh = () => {
      setQuery('');
      setFeedOrder(shuffle(store.excerptQuotes.map((q) => q.id)));
    };
    window.addEventListener(HOME_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(HOME_REFRESH_EVENT, onRefresh);
  }, [store.excerptQuotes]);

  const feed = useMemo(() => {
    const map = new Map(store.excerptQuotes.map((q) => [q.id, q]));
    let list = feedOrder.map((id) => map.get(id)).filter(Boolean) as Quote[];
    if (query.trim()) list = searchQuotes(list, store.state.authors, query);
    return list;
  }, [feedOrder, store.excerptQuotes, store.state.authors, query]);

  return (
    <div className="page page-home">
      <SearchBar value={query} onChange={setQuery} />
      <main className="feed">
        {feed.map((quote) => {
          const author = resolveAuthorForQuote(
            store.getAuthor(quote.authorId),
            store.state.userProfile.name,
          );
          const interaction = store.getInteraction(quote.id);
          const comments = store.getComments(quote.id);
          return (
            <QuoteCard
              key={quote.id}
              quote={quote}
              author={author}
              likes={interaction.likes}
              favorited={interaction.favorited}
              commentCount={comments.length}
              showTimestamp={false}
              onLike={() => store.likeQuote(quote.id)}
              onFavorite={() => store.toggleFavorite(quote.id)}
              onCommentClick={() => navigate(`/quote/${quote.id}#comments`, { state: { backTo: '/' } })}
              onCopy={() => void copyQuote(quote, author)}
              linkState={{ backTo: '/' }}
            />
          );
        })}
        {feed.length === 0 && <p className="empty">没有找到相关内容</p>}
      </main>
      <BottomNav />
    </div>
  );
}
