import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, adminAction } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type Row = {
  id: string;
  status: string;
  initial_message: string | null;
  from: { nickname: string | null };
  to: { nickname: string | null };
  created_at: string;
};

type List = { items: Row[] };

export function LettersPage() {
  const { can } = useAuth();
  const [searchParams] = useSearchParams();
  const urlRequestId = searchParams.get('request_id') ?? '';
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('letters:read')) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: '1', page_size: '40' });
      if (status) p.set('status', status);
      if (urlRequestId) p.set('request_id', urlRequestId);
      const d = await apiFetch<List>(`/admin/message-requests?${p}`);
      setData(d);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }, [can, status, urlRequestId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (urlRequestId) setStatus('');
  }, [urlRequestId]);

  async function letterAct(action_type: 'accept_message_request' | 'reject_message_request', id: string) {
    if (!can('letters:write')) return;
    const label =
      action_type === 'accept_message_request' ? '이 편지 요청을 수락합니다(대화 생성).' : '이 편지 요청을 거절합니다.';
    if (!window.confirm(`${label} 계속할까요?`)) return;
    try {
      await adminAction({
        action_type,
        target_type: 'message_request',
        target_id: id,
      });
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '실패');
    }
  }

  if (!can('letters:read')) {
    return <div className="restricted">편지 요청 조회 권한이 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">편지 요청</h1>
      <p className="page-desc">
        조각찾기 유료 편지 등으로 생성된 MessageRequest입니다. 운영자는 pending 건을 수락·거절할 수 있으며, 각 액션은 감사
        로그에 기록됩니다.
      </p>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체</option>
          <option value="pending">pending</option>
          <option value="accepted">accepted</option>
          <option value="rejected">rejected</option>
        </select>
        <button type="button" className="btn" onClick={() => void load()}>
          새로고침
        </button>
        {urlRequestId ? (
          <span className="muted" style={{ alignSelf: 'center' }}>
            특정 요청 필터 · <Link to="/letters">해제</Link>
          </span>
        ) : null}
      </div>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {data && data.items.length === 0 ? <div className="empty-box">요청 없음</div> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>상태</th>
                <th>ID</th>
                <th>보낸이 → 받는이</th>
                <th>첫 메시지</th>
                <th>시간</th>
                {can('letters:write') ? <th>운영</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="badge">{r.status}</span>
                  </td>
                  <td>
                    <code style={{ fontSize: 11 }} title={r.id}>
                      {r.id.slice(0, 8)}…
                    </code>
                  </td>
                  <td>
                    {r.from.nickname ?? '—'} → {r.to.nickname ?? '—'}
                  </td>
                  <td style={{ maxWidth: 360 }}>{r.initial_message ?? '—'}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  {can('letters:write') ? (
                    <td>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => void letterAct('accept_message_request', r.id)}
                          >
                            수락
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => void letterAct('reject_message_request', r.id)}
                          >
                            거절
                          </button>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
