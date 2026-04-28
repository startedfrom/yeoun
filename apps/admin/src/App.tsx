import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Shell } from './layout/Shell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { PostsPage } from './pages/PostsPage';
import { UsersPage } from './pages/UsersPage';
import { ChalnaPage } from './pages/ChalnaPage';
import { LettersPage } from './pages/LettersPage';
import { HashtagsPage } from './pages/HashtagsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { PieceFindPage } from './pages/PieceFindPage';
import { AuditPage } from './pages/AuditPage';

function Protected() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return <div className="login-page muted">세션 확인 중…</div>;
  }

  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  if (state.status === 'forbidden') {
    return (
      <div className="login-page">
        <div className="restricted" style={{ maxWidth: 420 }}>
          <strong>접근 제한</strong>
          <p style={{ margin: '8px 0 0' }}>{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/chalna" element={<ChalnaPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/letters" element={<LettersPage />} />
        <Route path="/hashtags" element={<HashtagsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/piece-find" element={<PieceFindPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}
