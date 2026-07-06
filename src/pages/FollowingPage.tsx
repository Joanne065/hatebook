import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { IconBack } from '../components/Icons';
import { BottomNav } from '../components/Layout';
import { useStore } from '../store/store';

export function FollowingPage() {
  const navigate = useNavigate();
  const store = useStore();

  const allAuthors = Object.values(store.state.authors).sort((a, b) =>
    a.nameCn.localeCompare(b.nameCn, 'zh'),
  );

  return (
    <div className="page page-following">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)}><IconBack /></button>
        <span className="page-title">作家</span>
      </header>

      <ul className="author-list">
        {allAuthors.map((author) => (
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

      <BottomNav />
    </div>
  );
}
