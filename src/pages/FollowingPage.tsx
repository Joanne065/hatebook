import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { IconBack, IconSearch } from '../components/Icons';
import { BottomNav, SearchBar } from '../components/Layout';
import { useStore } from '../store/store';
import { searchAuthors } from '../utils/helpers';
import { goBack } from '../utils/navigation';

export function FollowingPage() {
  const navigate = useNavigate();
  const store = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const allAuthors = useMemo(() => {
    const favoriteCounts: Record<string, number> = {};
    for (const q of store.visibleQuotes) {
      if (store.getInteraction(q.id).favorited) {
        favoriteCounts[q.authorId] = (favoriteCounts[q.authorId] ?? 0) + 1;
      }
    }
    return Object.values(store.state.authors).sort((a, b) => {
      const diff = (favoriteCounts[b.id] ?? 0) - (favoriteCounts[a.id] ?? 0);
      if (diff !== 0) return diff;
      return a.nameCn.localeCompare(b.nameCn, 'zh');
    });
  }, [store.state.authors, store.visibleQuotes, store.state.interactions]);

  const authors = useMemo(
    () => searchAuthors(allAuthors, query),
    [allAuthors, query],
  );

  return (
    <div className="page page-following">
      <header className="page-header page-header-with-tools">
        <button type="button" className="icon-btn" onClick={() => goBack(navigate, '/me')}><IconBack /></button>
        <span className="page-title">作家</span>
        <button
          type="button"
          className={`icon-btn page-header-search${searchOpen ? ' active' : ''}`}
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="搜索"
        >
          <IconSearch size={20} />
        </button>
      </header>

      {searchOpen && <SearchBar value={query} onChange={setQuery} />}

      <ul className="author-list">
        {authors.map((author) => (
          <li key={author.id}>
            <Link to={`/author/${author.id}`} className="author-list-item" state={{ backTo: '/following' }}>
              <Avatar author={author} size={44} />
              <div className="author-list-meta">
                <span className="author-list-name">{author.nameCn}</span>
                <span className="author-list-en">{author.nameEn}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {authors.length === 0 && <p className="empty">没有找到相关作家</p>}

      <BottomNav />
    </div>
  );
}
