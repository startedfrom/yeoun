import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type PostRow = {
  id: string;
  post_type: string;
  status: string;
  caption: string | null;
  expires_at: string | null;
  author: { nickname: string | null };
  thumb_url: string | null;
};

type List = { items: PostRow[] };

export function ChalnaPage() {
  const { can } = useAuth();
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('chalna:read')) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', page_size: '50', post_type: 'chalna' });
      const d = await apiFetch<List>(`/admin/posts?${params}`);
      setData(d);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!can('chalna:read')) {
    return <div className="restricted">찰나 조회 권한이 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">찰나</h1>
      <p className="page-desc">만료 시각 기준으로 소진 큐를 봅니다. 숨김·복구는 게시물 화면에서 동일 API를 씁니다.</p>
      <div className="toolbar">
        <button type="button" className="btn" onClick={() => void load()}>
          새로고침
        </button>
      </div>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {data && data.items.length === 0 ? <div className="empty-box">찰나 게시물 없음</div> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th />
                <th>작성자</th>
                <th>상태</th>
                <th>만료</th>
                <th>캡션</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id}>
                  <td>{p.thumb_url ? <img className="thumb" src={p.thumb_url} alt="" /> : '—'}</td>
                  <td>{p.author.nickname ?? '—'}</td>
                  <td>
                    <span className="badge">{p.status}</span>
                  </td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {p.expires_at ? new Date(p.expires_at).toLocaleString() : '—'}
                  </td>
                  <td>{p.caption ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
