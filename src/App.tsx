import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store/store';
import { HomePage } from './pages/HomePage';
import { QuoteDetailPage } from './pages/QuoteDetailPage';
import { AuthorPage } from './pages/AuthorPage';
import { MePage } from './pages/MePage';
import { FollowingPage } from './pages/FollowingPage';
import { AddPage } from './pages/AddPage';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quote/:id" element={<QuoteDetailPage />} />
            <Route path="/author/:id" element={<AuthorPage />} />
            <Route path="/me" element={<MePage />} />
            <Route path="/following" element={<FollowingPage />} />
            <Route path="/add" element={<AddPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </StoreProvider>
  );
}
