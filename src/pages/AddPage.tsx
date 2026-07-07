import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BottomNav } from '../components/Layout';
import { IconBack, IconClose } from '../components/Icons';
import { useStore } from '../store/store';

type Tab = 'excerpt' | 'essay';

const emptyAuthor = { nameCn: '', nameEn: '', ip: '', bio: '', profession: '', tags: ['', '', '', ''] };
const emptyQuote = { text: '', original: '', source: '' };
const emptyEssay = { text: '', supplement: '', location: '' };

export function AddPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const store = useStore();

  const authorId = params.get('author');
  const editId = params.get('edit');
  const initialTab: Tab = params.get('mode') === 'essay' ? 'essay' : 'excerpt';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [authorForm, setAuthorForm] = useState(emptyAuthor);
  const [quoteForm, setQuoteForm] = useState(emptyQuote);
  const [essayForm, setEssayForm] = useState(emptyEssay);

  useEffect(() => {
    if (authorId && store.state.authors[authorId]) {
      const a = store.state.authors[authorId];
      setAuthorForm({
        nameCn: a.nameCn,
        nameEn: a.nameEn,
        ip: a.ip ?? '',
        bio: a.bio ?? '',
        profession: a.profession ?? '',
        tags: [...(a.tags ?? []), '', '', ''].slice(0, 4),
      });
      setTab('excerpt');
    }
    if (editId) {
      const q = store.getQuote(editId);
      if (!q) return;
      if (q.type === 'essay') {
        setTab('essay');
        setEssayForm({ text: q.text, supplement: q.supplement ?? '', location: q.location ?? '' });
      } else {
        setTab('excerpt');
        setQuoteForm({ text: q.text, original: q.original ?? '', source: q.source ?? '' });
        const a = store.getAuthor(q.authorId);
        if (a) {
          setAuthorForm({
            nameCn: a.nameCn,
            nameEn: a.nameEn,
            ip: a.ip ?? '',
            bio: a.bio ?? '',
            profession: a.profession ?? '',
            tags: [...(a.tags ?? []), '', '', ''].slice(0, 4),
          });
        }
      }
    }
  }, [authorId, editId, store]);

  const updateTag = (i: number, v: string) => {
    const tags = [...authorForm.tags];
    tags[i] = v;
    setAuthorForm({ ...authorForm, tags });
  };

  const removeTag = (i: number) => {
    const tags = authorForm.tags.filter((_, idx) => idx !== i);
    while (tags.length < 4) tags.push('');
    setAuthorForm({ ...authorForm, tags });
  };

  const submitExcerpt = () => {
    if (!quoteForm.text.trim() && !authorForm.nameCn.trim()) {
      navigate(-1);
      return;
    }
    if (editId) {
      store.updateQuote(editId, {
        text: quoteForm.text,
        original: quoteForm.original || undefined,
        source: quoteForm.source || undefined,
      });
      if (authorId || store.getQuote(editId)?.authorId) {
        const aid = authorId ?? store.getQuote(editId)!.authorId;
        store.updateAuthor(aid, {
          nameCn: authorForm.nameCn || undefined,
          nameEn: authorForm.nameEn || undefined,
          ip: authorForm.ip || undefined,
          bio: authorForm.bio || undefined,
          profession: authorForm.profession || undefined,
          tags: authorForm.tags.filter(Boolean),
        });
      }
      navigate(`/quote/${editId}`, { replace: true });
      return;
    }
    const id = store.addExcerpt(
      {
        nameCn: authorForm.nameCn || '佚名',
        nameEn: authorForm.nameEn || 'Unknown',
        ip: authorForm.ip || undefined,
        bio: authorForm.bio || undefined,
        profession: authorForm.profession || undefined,
        tags: authorForm.tags.filter(Boolean),
      },
      {
        text: quoteForm.text,
        original: quoteForm.original || undefined,
        source: quoteForm.source || undefined,
      },
    );
    if (authorId) {
      navigate(`/author/${authorId}`, { replace: true });
    } else {
      navigate(`/quote/${id}`, { replace: true, state: { fromPublish: true, backTo: '/' } });
    }
  };

  const submitEssay = () => {
    if (!essayForm.text.trim()) {
      navigate(-1);
      return;
    }
    if (editId) {
      store.updateQuote(editId, {
        text: essayForm.text,
        supplement: essayForm.supplement || undefined,
        location: essayForm.location || undefined,
      });
      navigate(`/quote/${editId}`, { replace: true });
      return;
    }
    const id = store.addEssay({
      text: essayForm.text,
      supplement: essayForm.supplement || undefined,
      location: essayForm.location || undefined,
    });
    navigate(`/quote/${id}`, { replace: true, state: { fromPublish: true, backTo: '/me' } });
  };

  const now = new Date();
  const ts = `${now.getFullYear()} – ${String(now.getMonth() + 1).padStart(2, '0')} – ${String(now.getDate()).padStart(2, '0')}\n${String(now.getHours()).padStart(2, '0')} : ${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="page page-add">
      <header className="add-header">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <IconBack />
        </button>
      </header>
      <div className="add-tabs">
        <button type="button" className={tab === 'excerpt' ? 'active' : ''} onClick={() => setTab('excerpt')} disabled={!!authorId && !editId}>
          摘录
        </button>
        <button type="button" className={tab === 'essay' ? 'active' : ''} onClick={() => setTab('essay')} disabled={!!authorId}>
          我想说
        </button>
      </div>

      {tab === 'excerpt' ? (
        <form className="add-form" onSubmit={(e) => { e.preventDefault(); submitExcerpt(); }}>
          <div className="form-row">
            <label>作者名:</label>
            <div className="form-stack">
              <input placeholder="中文" value={authorForm.nameCn} onChange={(e) => setAuthorForm({ ...authorForm, nameCn: e.target.value })} disabled={!!authorId && !editId} />
              <input placeholder="英文/其他" value={authorForm.nameEn} onChange={(e) => setAuthorForm({ ...authorForm, nameEn: e.target.value })} disabled={!!authorId && !editId} />
            </div>
          </div>
          <div className="form-row">
            <label>作者IP:</label>
            <input value={authorForm.ip} onChange={(e) => setAuthorForm({ ...authorForm, ip: e.target.value })} disabled={!!authorId && !editId} />
          </div>
          <div className="form-row">
            <label>作者简介:</label>
            <textarea value={authorForm.bio} onChange={(e) => setAuthorForm({ ...authorForm, bio: e.target.value })} disabled={!!authorId && !editId} />
          </div>
          <div className="form-row">
            <label>作者标签:</label>
            <div className="tag-inputs">
              {authorForm.tags.map((t, i) => (
                <div key={i} className="tag-input-wrap">
                  <input value={t} onChange={(e) => updateTag(i, e.target.value)} disabled={!!authorId && !editId} />
                  {t && <button type="button" className="tag-remove" onClick={() => removeTag(i)}><IconClose /></button>}
                </div>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label>语录:</label>
            <textarea value={quoteForm.text} onChange={(e) => setQuoteForm({ ...quoteForm, text: e.target.value })} />
          </div>
          <div className="form-row">
            <label>原文:</label>
            <textarea value={quoteForm.original} onChange={(e) => setQuoteForm({ ...quoteForm, original: e.target.value })} />
          </div>
          <div className="form-row">
            <label>出处:</label>
            <input value={quoteForm.source} onChange={(e) => setQuoteForm({ ...quoteForm, source: e.target.value })} />
          </div>
          <button type="submit" className="submit-circle">{editId ? '保存' : '添加'}</button>
        </form>
      ) : (
        <form className="add-form add-form-essay" onSubmit={(e) => { e.preventDefault(); submitEssay(); }}>
          <textarea
            className="essay-main"
            placeholder=""
            value={essayForm.text}
            onChange={(e) => setEssayForm({ ...essayForm, text: e.target.value })}
          />
          <div className="form-row">
            <label>补充:</label>
            <input value={essayForm.supplement} onChange={(e) => setEssayForm({ ...essayForm, supplement: e.target.value })} />
          </div>
          <div className="form-row">
            <label>地点:</label>
            <input value={essayForm.location} onChange={(e) => setEssayForm({ ...essayForm, location: e.target.value })} />
          </div>
          <pre className="add-timestamp">{ts}</pre>
          <button type="submit" className="submit-circle">{editId ? '保存' : '发布'}</button>
        </form>
      )}

      <BottomNav />
    </div>
  );
}
