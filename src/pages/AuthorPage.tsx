import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MasonryFeed } from '../components/MasonryFeed';
import { BatchSelectWrap } from '../components/BatchSelectWrap';
import { Avatar } from '../components/Avatar';
import { GridQuoteCard } from '../components/QuoteCard';
import { IconBack, IconEdit, IconMenu } from '../components/Icons';
import { ProfileTabTools, SearchBar } from '../components/Layout';
import type { AuthorTab } from '../types';
import { useStore, searchQuotes } from '../store/store';
import { getAuthorDisplayTags, getAuthorLifespanDisplay } from '../utils/authorMeta';
import { goBack, readLocationState } from '../utils/navigation';

export function AuthorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const pageState = readLocationState(location.state);
  const backTo = pageState.backTo ?? '/';
  const store = useStore();
  const [tab, setTab] = useState<AuthorTab>('notes');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', ip: '', profession: '', tags: '' });

  const author = id ? store.state.authors[id] : undefined;

  const quotes = useMemo(() => {
    if (!id) return [];
    let list = store.excerptQuotes.filter((q) => q.authorId === id);
    if (query.trim()) list = searchQuotes(list, store.state.authors, query);
    if (tab === 'likes') list = [...list].sort((a, b) => store.getInteraction(b.id).likes - store.getInteraction(a.id).likes);
    if (tab === 'collected') list = list.filter((q) => store.getInteraction(q.id).favorited);
    return list;
  }, [id, store, tab, query]);

  if (!author) {
    return (
      <div className="page">
        <header className="page-header"><button type="button" onClick={() => goBack(navigate, '/')}><IconBack /></button></header>
        <p className="empty">作者不存在</p>
      </div>
    );
  }

  const displayTags = getAuthorDisplayTags(author);
  const lifespanDisplay = getAuthorLifespanDisplay(author.lifespan);

  const openEdit = () => {
    setEditForm({
      bio: author.bio ?? '',
      ip: author.ip ?? '',
      profession: author.profession ?? '',
      tags: displayTags.join('、'),
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    store.updateAuthor(author.id, {
      bio: editForm.bio || undefined,
      ip: editForm.ip || undefined,
      profession: editForm.profession || undefined,
      tags: editForm.tags ? editForm.tags.split(/[、,，]/).map((t) => t.trim()).filter(Boolean) : [],
    });
    setEditOpen(false);
  };

  const toggleSelect = (quoteId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) next.delete(quoteId);
      else next.add(quoteId);
      return next;
    });
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (confirm(`删除选中的 ${selected.size} 条？`)) {
      store.deleteQuotes([...selected]);
      setSelected(new Set());
      setBatchMode(false);
    }
  };

  return (
    <div className="page page-profile">
      <header className="profile-header">
        <button type="button" className="icon-btn" onClick={() => goBack(navigate, backTo)}><IconBack /></button>
        <div className="profile-header-actions">
          <button
            type="button"
            className={`icon-btn${batchMode ? ' active' : ''}`}
            onClick={() => { setBatchMode(!batchMode); setSelected(new Set()); }}
          >
            <IconMenu />
          </button>
          <button type="button" className="icon-btn" onClick={openEdit}><IconEdit /></button>
        </div>
      </header>

      <div className="profile-info">
        <Avatar author={author} size={56} />
        <div>
          <h1>{author.nameCn}</h1>
          <p className="profile-name-en">{author.nameEn}</p>
          {author.ip && <p className="profile-sub">IP: {author.ip}</p>}
          {lifespanDisplay && <p className="profile-sub">{lifespanDisplay}</p>}
          {author.profession && <p className="profile-sub">{author.profession}</p>}
          {author.bio && <p className="profile-bio">{author.bio}</p>}
          {displayTags.length > 0 && (
            <div className="tag-row">
              {displayTags.map((t) => <span key={t} className="tag">{t}</span>)}
            </div>
          )}
        </div>
      </div>

      <div className="profile-tabs">
        {(['notes', 'likes', 'collected'] as AuthorTab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t === 'notes' ? '笔记' : t === 'likes' ? '点赞数' : '已收藏'}
          </button>
        ))}
        <ProfileTabTools
          addTo={`/add?author=${author.id}`}
          searchOpen={searchOpen}
          onToggleSearch={() => setSearchOpen((v) => !v)}
        />
      </div>

      {searchOpen && <SearchBar value={query} onChange={setQuery} />}

      {batchMode && selected.size > 0 && (
        <div className="batch-bar">
          <span>已选 {selected.size} 条</span>
          <button type="button" onClick={deleteSelected}>删除</button>
        </div>
      )}

      <MasonryFeed>
        {quotes.map((q) => (
          <BatchSelectWrap
            key={q.id}
            batchMode={batchMode}
            selected={selected.has(q.id)}
            onToggle={() => toggleSelect(q.id)}
          >
            <div
              className="masonry-item"
              onContextMenu={(e) => {
                if (batchMode) return;
                e.preventDefault();
                const action = prompt('输入 e 编辑 / d 删除');
                if (action === 'd' && confirm('删除？')) store.deleteQuotes([q.id]);
                if (action === 'e') navigate(`/add?edit=${q.id}`, { state: { backTo: `/author/${author.id}` } });
              }}
            >
              <GridQuoteCard
                quote={q}
                author={author}
                likes={store.getInteraction(q.id).likes}
                to={batchMode ? '#' : `/quote/${q.id}`}
                linkState={batchMode ? undefined : {
                  authorFeed: true,
                  backTo: `/author/${author.id}`,
                  restoreState: pageState,
                }}
              />
            </div>
          </BatchSelectWrap>
        ))}
      </MasonryFeed>

      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>编辑作者简介</h2>
            <label>IP<input value={editForm.ip} onChange={(e) => setEditForm({ ...editForm, ip: e.target.value })} /></label>
            <label>职业<input value={editForm.profession} onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })} /></label>
            <label>简介<textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></label>
            <label>标签<input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="用顿号分隔，含星座" /></label>
            <div className="modal-actions">
              <button type="button" onClick={() => setEditOpen(false)}>取消</button>
              <button type="button" className="primary" onClick={saveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
