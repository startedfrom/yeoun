import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type Row = {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  note: string | null;
  created_at: string;
  admin: { nickname: string | null };
};

type List = { items: Row[] };

export function AuditPage() {
  const { can } = useAuth();
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('audit:read')) return;
    setLoading(true);
    try {
      const d = await apiFetch<List>('/admin/audit-logs?page=1&page_size=80');
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

  if (!can('audit:read')) {
    return <div className="restricted">감사 로그를 볼 수 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">감사 로그</h1>
      <p className="page-desc">관리자 액션은 모두 append-only 로그로 남습니다. 무드 태그 수정은 note에 JSON 스냅샷이 들어갑니다.</p>
      <div className="toolbar">
        <button type="button" className="btn" onClick={() => void load()}>
          새로고침
        </button>
      </div>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {data && data.items.length === 0 ? <div className="empty-box">기록 없음</div> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>시간</th>
                <th>관리자</th>
                <th>액션</th>
                <th>대상</th>
                <th>메모</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td>{r.admin.nickname ?? '—'}</td>
                  <td>
                    <code>{r.action_type}</code>
                  </td>
                  <td>
                    {r.target_type} / <code>{r.target_id.slice(0, 8)}…</code>
                  </td>
                  <td style={{ maxWidth: 360 }}>{r.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
