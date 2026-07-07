import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { IconBack, IconSearch } from '../components/Icons';
import { BottomNav, SearchBar } from '../components/Layout';
import { useStore } from '../store/store';
import { searchAuthors } from '../utils/helpers';

export function FollowingPage() {
  const navigate = useNavigate();
  const store = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const allAuthors = useMemo(
    () => Object.values(store.state.authors).sort((a, b) => a.nameCn.localeCompare(b.nameCn, 'zh')),
    [store.state.authors],
  );

  const authors = useMemo(
    () => searchAuthors(allAuthors, query),
    [allAuthors, query],
  );

  return (
    <div className="page page-following">
      <header className="page-header page-header-with-tools">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)}><IconBack /></button>
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
            <Link to={`/author/${author.id}`} className="author-list-item">
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
