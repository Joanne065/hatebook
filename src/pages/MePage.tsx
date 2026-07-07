import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { GridQuoteCard } from '../components/QuoteCard';
import { IconEdit, IconMenu } from '../components/Icons';
import { BottomNav, ProfileTabTools, SearchBar } from '../components/Layout';
import type { MeTab, Quote } from '../types';
import { useStore, searchQuotes } from '../store/store';
import { ME_AUTHOR_ID } from '../utils/helpers';
import { fileToGrayscaleDataUrl } from '../utils/image';

export function MePage() {
  const navigate = useNavigate();
  const store = useStore();
  const [tab, setTab] = useState<MeTab>('notes');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editOpen, setEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(store.state.userProfile);

  const authorCount = Object.keys(store.state.authors).length;

  const meAuthor = {
    id: ME_AUTHOR_ID,
    nameCn: store.state.userProfile.name,
    nameEn: store.state.userProfile.name,
    bio: store.state.userProfile.bio,
    ip: store.state.userProfile.location,
    avatarUrl: store.state.userProfile.avatarUrl,
  };

  const quotes = useMemo(() => {
    let list: Quote[] = [];
    if (tab === 'notes') list = store.essayQuotes;
    else if (tab === 'liked') list = store.visibleQuotes.filter((q) => store.getInteraction(q.id).likes > 0);
    else if (tab === 'collected') list = store.visibleQuotes.filter((q) => store.getInteraction(q.id).favorited);
    else list = store.visibleQuotes.filter((q) => store.getComments(q.id).length > 0);
    if (query.trim()) list = searchQuotes(list, store.state.authors, query);
    return list;
  }, [store, tab, query]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAvatarUpload = (file: File) => {
    void fileToGrayscaleDataUrl(file).then((dataUrl) => {
      setProfileForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
    });
  };

  return (
    <div className="page page-profile">
      <header className="profile-header">
        <span />
        <div className="profile-header-actions">
          <button type="button" className="icon-btn" onClick={() => { setBatchMode(!batchMode); setSelected(new Set()); }}><IconMenu /></button>
          <button type="button" className="icon-btn" onClick={() => { setProfileForm(store.state.userProfile); setEditOpen(true); }}><IconEdit /></button>
        </div>
      </header>

      <div className="profile-info">
        <Avatar author={meAuthor} size={56} />
        <div>
          <h1>{store.state.userProfile.name}</h1>
          {store.state.userProfile.bio && <p className="profile-bio">{store.state.userProfile.bio}</p>}
          <Link to="/following" className="follow-stat">
            <strong>{authorCount}</strong> 关注
          </Link>
        </div>
      </div>

      <div className="profile-tabs">
        {([
          ['notes', '笔记'],
          ['liked', '赞过'],
          ['collected', '收藏'],
          ['commented', '评论过'],
        ] as [MeTab, string][]).map(([t, label]) => (
          <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
        <ProfileTabTools
          addTo="/add?mode=essay"
          searchOpen={searchOpen}
          onToggleSearch={() => setSearchOpen((v) => !v)}
        />
      </div>

      {searchOpen && <SearchBar value={query} onChange={setQuery} />}

      {batchMode && selected.size > 0 && (
        <div className="batch-bar">
          <span>已选 {selected.size} 条</span>
          <button type="button" onClick={() => { store.deleteQuotes([...selected]); setSelected(new Set()); setBatchMode(false); }}>删除</button>
        </div>
      )}

      <div className="masonry-feed">
        {quotes.map((q) => {
          const author = q.type === 'essay' ? meAuthor : store.getAuthor(q.authorId)!;
          return (
            <div
              key={q.id}
              className={`masonry-item${batchMode && selected.has(q.id) ? ' selected' : ''}`}
              onContextMenu={(e) => {
                e.preventDefault();
                const action = prompt('输入 e 编辑 / d 删除');
                if (action === 'd') store.deleteQuotes([q.id]);
                if (action === 'e') navigate(`/add?edit=${q.id}`);
              }}
              onClick={batchMode ? () => toggleSelect(q.id) : undefined}
            >
              <GridQuoteCard
                quote={q}
                author={author}
                likes={store.getInteraction(q.id).likes}
                to={batchMode ? '#' : `/quote/${q.id}`}
                showAuthor={tab === 'collected' || tab === 'liked'}
              />
            </div>
          );
        })}
      </div>

      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>编辑个人资料</h2>
            <label className="avatar-upload-label">
              头像
              <div className="avatar-upload-row">
                <Avatar author={{ ...meAuthor, avatarUrl: profileForm.avatarUrl }} size={48} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatarUpload(f);
                  }}
                />
              </div>
            </label>
            <label>名字<input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></label>
            <label>签名<textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} /></label>
            <label>地点<input value={profileForm.location ?? ''} onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} /></label>
            <div className="modal-actions">
              <button type="button" onClick={() => setEditOpen(false)}>取消</button>
              <button type="button" className="primary" onClick={() => { store.updateUserProfile(profileForm); setEditOpen(false); }}>保存</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
