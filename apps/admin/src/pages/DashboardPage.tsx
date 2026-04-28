import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type Dash = {
  reports_open: number;
  reports_submitted: number;
  posts_last_24h: number;
  chalna_active_now: number;
  piece_find_open_sessions: number;
  paid_letters_last_7d: number;
  users_active: number;
  posts_fashion_blocked_active: number;
};

export function DashboardPage() {
  const { can } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!can('dashboard:read')) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await apiFetch<Dash>('/admin/dashboard');
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : '로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [can]);

  if (!can('dashboard:read')) {
    return <div className="restricted">이 역할로는 대시보드를 볼 수 없습니다.</div>;
  }

  if (loading) return <p className="muted">불러오는 중…</p>;
  if (err) return <div className="error-box">{err}</div>;
  if (!data) return <div className="empty-box">데이터 없음</div>;

  const tiles = [
    { k: '열린 신고', v: data.reports_open, sub: `미처리 제출 ${data.reports_submitted}` },
    { k: '24h 신규 게시물', v: data.posts_last_24h },
    { k: '만료 전 찰나', v: data.chalna_active_now },
    { k: '조각찾기 열린 세션', v: data.piece_find_open_sessions },
    { k: '7일 유료 편지', v: data.paid_letters_last_7d },
    { k: '활성 사용자', v: data.users_active },
    { k: '패션 비적합(활성 게시물)', v: data.posts_fashion_blocked_active, warn: data.posts_fashion_blocked_active > 0 },
  ];

  return (
    <>
      <h1 className="page-title">대시보드</h1>
      <p className="page-desc">
        카드 수치는 배너용이 아니라 큐 깊이를 보여줍니다. 신고·조각찾기·패션 큐를 매일 확인하는 운영 리듬을 전제로 했습니다.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
        }}
      >
        {tiles.map((t) => (
          <div
            key={t.k}
            className="panel"
            style={{
              borderColor: t.warn ? '#6a5520' : undefined,
            }}
          >
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.k}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{t.v}</div>
            {t.sub ? <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{t.sub}</div> : null}
          </div>
        ))}
      </div>
    </>
  );
}
