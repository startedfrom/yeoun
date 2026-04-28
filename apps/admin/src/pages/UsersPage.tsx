import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, adminAction } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type UserRow = {
  id: string;
  email: string | null;
  status: string;
  role: string;
  nickname: string | null;
  created_at: string;
};

type List = { items: UserRow[] };

export function UsersPage() {
  const { can } = useAuth();
  const [searchParams] = useSearchParams();
  const urlUserId = searchParams.get('user_id') ?? '';
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('users:read')) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: '1', page_size: '40' });
      if (urlUserId) p.set('user_id', urlUserId);
      if (q) p.set('q', q);
      if (status) p.set('status', status);
      const d = await apiFetch<List>(`/admin/users?${p}`);
      setData(d);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }, [can, q, status, urlUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function suspend(id: string) {
    if (!can('users:write')) return;
    if (!window.confirm('이 사용자를 정지합니다. 로그인도 막힙니다.')) return;
    await adminAction({ action_type: 'suspend_user', target_type: 'user', target_id: id });
    await load();
  }

  async function unsuspend(id: string) {
    if (!can('users:write')) return;
    if (!window.confirm('정지를 해제합니다.')) return;
    await adminAction({ action_type: 'unsuspend_user', target_type: 'user', target_id: id });
    await load();
  }

  if (!can('users:read')) {
    return <div className="restricted">사용자 조회 권한이 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">사용자</h1>
      <p className="page-desc">이메일·닉네임 검색, 상태 필터. 정지는 consumer 로그인까지 막습니다.</p>
      <div className="toolbar">
        <input placeholder="이메일/닉네임" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">상태 전체</option>
          <option value="active">active</option>
          <option value="suspended">suspended</option>
        </select>
        <button type="button" className="btn" onClick={() => void load()}>
          검색
        </button>
        {urlUserId ? (
          <span className="muted" style={{ alignSelf: 'center' }}>
            URL 사용자 필터 · <Link to="/users">해제</Link>
          </span>
        ) : null}
      </div>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {data && data.items.length === 0 ? <div className="empty-box">결과 없음</div> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>이메일</th>
                <th>역할</th>
                <th>상태</th>
                <th>가입</th>
                {can('users:write') ? <th>액션</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td>{u.nickname ?? '—'}</td>
                  <td>{u.email ?? '—'}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`badge ${u.status === 'suspended' ? 'badge-warn' : ''}`}>{u.status}</span>
                  </td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  {can('users:write') ? (
                    <td>
                      {u.status === 'active' ? (
                        <button type="button" className="btn btn-danger" onClick={() => void suspend(u.id)}>
                          정지
                        </button>
                      ) : (
                        <button type="button" className="btn" onClick={() => void unsuspend(u.id)}>
                          정지 해제
                        </button>
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
