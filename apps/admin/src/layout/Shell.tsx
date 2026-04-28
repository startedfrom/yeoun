import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

const nav = [
  { to: '/', label: '대시보드', end: true },
  { to: '/reports', label: '신고' },
  { to: '/posts', label: '게시물' },
  { to: '/chalna', label: '찰나' },
  { to: '/users', label: '사용자' },
  { to: '/letters', label: '편지 요청' },
  { to: '/hashtags', label: '무드 태그' },
  { to: '/payments', label: '결제·권한' },
  { to: '/piece-find', label: '조각찾기' },
  { to: '/audit', label: '감사 로그' },
];

export function Shell({ children }: { children: ReactNode }) {
  const { state, logout } = useAuth();
  const me = state.status === 'ready' ? state.me : null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>여운 운영</h1>
        <nav>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 24, padding: '0 10px', fontSize: 12, color: 'var(--muted)' }}>
          {me ? (
            <>
              <div>{me.nickname ?? me.email}</div>
              <div style={{ marginTop: 4 }}>role: {me.role}</div>
              <button type="button" className="btn" style={{ marginTop: 12, width: '100%' }} onClick={() => logout()}>
                로그아웃
              </button>
            </>
          ) : null}
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
