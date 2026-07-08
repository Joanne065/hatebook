import { NavLink, Link, useLocation } from 'react-router-dom';
import { IconPlus, IconSearch } from './Icons';

export const HOME_REFRESH_EVENT = 'xiaohhenshu-home-refresh';

export function BottomNav() {
  const location = useLocation();

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname !== '/') return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new CustomEvent(HOME_REFRESH_EVENT));
  };

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end onClick={handleHomeClick}>
        首页
      </NavLink>
      <NavLink to="/add" className="bottom-nav-add">
        <span className="add-btn"><IconPlus /></span>
      </NavLink>
      <NavLink to="/me" className={({ isActive }) => (isActive ? 'active' : '')}>
        我
      </NavLink>
    </nav>
  );
}

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder=""
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="清除">
          ×
        </button>
      ) : (
        <span className="search-icon" aria-hidden>
          <IconSearch size={22} />
        </span>
      )}
    </div>
  );
}

export function ProfileTabTools({
  addTo,
  searchOpen,
  onToggleSearch,
}: {
  addTo: string;
  searchOpen: boolean;
  onToggleSearch: () => void;
}) {
  return (
    <div className="profile-tab-tools">
      <Link to={addTo} className="icon-btn profile-tool-btn" aria-label="添加">
        <IconPlus size={20} />
      </Link>
      <button
        type="button"
        className={`icon-btn profile-tool-btn${searchOpen ? ' active' : ''}`}
        onClick={onToggleSearch}
        aria-label="搜索"
      >
        <IconSearch size={20} />
      </button>
    </div>
  );
}
