import { useState } from 'react';
import type { Comment } from '../types';
import { formatDateTime } from '../utils/helpers';
import { IconHeart } from './Icons';

interface CommentSectionProps {
  comments: Comment[];
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
}

export function CommentSection({ comments, onAdd, onDelete, onLike }: CommentSectionProps) {
  const [text, setText] = useState('');
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText('');
  };

  return (
    <section className="comments">
      <h3 className="comments-title">评论 {comments.length}</h3>
      <div className="comment-input-row">
        <input
          className="comment-input"
          placeholder="写评论…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button type="button" className="comment-submit" onClick={submit}>发送</button>
      </div>
      <ul className="comment-list">
        {comments.map((c) => (
          <li
            key={c.id}
            className={`comment-item${swipedId === c.id ? ' swiped' : ''}`}
            onContextMenu={(e) => {
              e.preventDefault();
              if (confirm('删除这条评论？')) onDelete(c.id);
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as HTMLElement).dataset.startX = String(touch.clientX);
            }}
            onTouchMove={(e) => {
              const startX = Number((e.currentTarget as HTMLElement).dataset.startX);
              const dx = e.touches[0].clientX - startX;
              if (dx < -60) setSwipedId(c.id);
              else if (dx > 20) setSwipedId(null);
            }}
          >
            <div className="comment-body">
              <time>{formatDateTime(c.createdAt)}</time>
              <p>{c.text}</p>
              <button type="button" className="comment-like" onClick={() => onLike(c.id)}>
                <IconHeart filled={c.likes > 0} /> {c.likes > 0 && c.likes}
              </button>
            </div>
            <button type="button" className="comment-delete" onClick={() => onDelete(c.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
