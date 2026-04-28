import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type Pair = {
  id: string;
  status: string;
  expires_at: string;
  viewer: { nickname: string | null };
  post_a: { id: string; thumb: string | null; author: string | null };
  post_b: { id: string; thumb: string | null; author: string | null };
};

type Paid = {
  id: string;
  payment_reference: string | null;
  created_at: string;
  sender: { nickname: string | null };
  message_request: { initial_message: string | null } | null;
};

export function PieceFindPage() {
  const { can } = useAuth();
  const [tab, setTab] = useState<'pairs' | 'letters'>('pairs');
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [letters, setLetters] = useState<Paid[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('piece_find:read')) return;
    setLoading(true);
    setErr(null);
    try {
      const [p, l] = await Promise.all([
        apiFetch<{ items: Pair[] }>('/admin/piece-find/pairs?page=1&page_size=40'),
        apiFetch<{ items: Paid[] }>('/admin/piece-find/paid-letters?page=1&page_size=40'),
      ]);
      setPairs(p.items);
      setLetters(l.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!can('piece_find:read')) {
    return <div className="restricted">조각찾기 운영 화면 권한이 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">조각찾기 운영</h1>
      <p className="page-desc">
        생성된 쌍 품질을 썸네일로 빠르게 스캔합니다. 특정 게시물을 전역 후보에서 빼려면 게시물 화면의 “조각찾기 전역 제외”를
        사용합니다(모든 유저 풀에서 제외).
      </p>
      <div className="toolbar">
        <button type="button" className={`btn ${tab === 'pairs' ? 'btn-primary' : ''}`} onClick={() => setTab('pairs')}>
          쌍 QA
        </button>
        <button
          type="button"
          className={`btn ${tab === 'letters' ? 'btn-primary' : ''}`}
          onClick={() => setTab('letters')}
        >
          유료 편지
        </button>
        <button type="button" className="btn" onClick={() => void load()}>
          새로고침
        </button>
      </div>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {tab === 'pairs' ? (
        pairs.length === 0 ? (
          <div className="empty-box">세션 없음</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>뷰어</th>
                  <th>A</th>
                  <th>B</th>
                  <th>만료</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="badge">{s.status}</span>
                    </td>
                    <td>{s.viewer.nickname ?? '—'}</td>
                    <td>
                      {s.post_a.thumb ? <img className="thumb" src={s.post_a.thumb} alt="" /> : '—'}
                      <div className="muted" style={{ fontSize: 11 }}>
                        {s.post_a.author ?? ''}
                      </div>
                    </td>
                    <td>
                      {s.post_b.thumb ? <img className="thumb" src={s.post_b.thumb} alt="" /> : '—'}
                      <div className="muted" style={{ fontSize: 11 }}>
                        {s.post_b.author ?? ''}
                      </div>
                    </td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(s.expires_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : letters.length === 0 ? (
        <div className="empty-box">유료 편지 없음</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>시간</th>
                <th>보낸이</th>
                <th>편지 본문</th>
                <th>결제 ref</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((r) => (
                <tr key={r.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td>{r.sender.nickname ?? '—'}</td>
                  <td style={{ maxWidth: 480 }}>{r.message_request?.initial_message ?? '—'}</td>
                  <td>
                    <code>{r.payment_reference ?? '—'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
