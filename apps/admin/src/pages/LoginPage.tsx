import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { state, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('ops@gamdojang.local');
  const [password, setPassword] = useState('0000');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (state.status === 'ready') {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      nav('/', { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : '로그인 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>여운 운영 콘솔</h1>
        <p className="muted" style={{ margin: 0 }}>
          내부 운영 전용. consumer 앱과 분리된 계정으로 로그인하세요.
        </p>
        {err ? <p className="error-box" style={{ marginTop: 12 }}>{err}</p> : null}
        <label htmlFor="email">이메일</label>
        <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw">비밀번호</label>
        <input
          id="pw"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? '확인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
