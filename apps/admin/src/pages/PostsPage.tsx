import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, adminAction } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type PostRow = {
  id: string;
  post_type: string;
  status: string;
  caption: string | null;
  created_at: string;
  fashion_eligible: boolean;
  piece_find_globally_excluded: boolean;
  author: { id: string; nickname: string | null };
  thumb_url: string | null;
  mood_tags: { id: string; name: string }[];
};

type List = { total: number; items: PostRow[] };

export function PostsPage() {
  const { can } = useAuth();
  const [searchParams] = useSearchParams();
  const urlPostId = searchParams.get('post_id') ?? '';
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [fashion, setFashion] = useState('');
  const [pf, setPf] = useState('');
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<PostRow | null>(null);

  const load = useCallback(async () => {
    if (!can('posts:read')) return;
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ page: '1', page_size: '30', post_type: 'regular' });
      if (urlPostId) params.set('post_id', urlPostId);
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (fashion) params.set('fashion_eligible', fashion);
      if (pf) params.set('piece_find_excluded', pf);
      const d = await apiFetch<List>(`/admin/posts?${params}`);
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }, [can, q, status, fashion, pf, urlPostId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function hide(id: string) {
    if (!can('posts:write')) return;
    if (!window.confirm('이 게시물을 숨김 처리합니다. 계속할까요?')) return;
    await adminAction({ action_type: 'hide_post', target_type: 'post', target_id: id });
    await load();
  }

  async function restore(id: string) {
    if (!can('posts:write')) return;
    if (!window.confirm('숨김을 해제하고 active로 되돌립니다.')) return;
    await adminAction({ action_type: 'restore_post', target_type: 'post', target_id: id });
    await load();
  }

  async function setFlags(id: string, flags: Record<string, boolean>) {
    if (!can('posts:write')) return;
    if (!window.confirm('조각찾기·패션 플래그를 변경합니다. 계속할까요?')) return;
    await adminAction({
      action_type: 'set_post_flags',
      target_type: 'post',
      target_id: id,
      flags,
    });
    await load();
    setSel(null);
  }

  if (!can('posts:read')) {
    return <div className="restricted">게시물 조회 권한이 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">게시물</h1>
      <p className="page-desc">
        패션 적합 여부와 조각찾기 전역 제외는 후보 풀에 직접 영향을 줍니다. 라이프스타일 전용 룩은 fashion off, 논쟁 쌍
        제거는 piece_find 전역 제외를 씁니다.
      </p>
      <div className="toolbar">
        <input placeholder="캡션 검색" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 160 }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">상태 전체</option>
          <option value="active">active</option>
          <option value="hidden">hidden</option>
        </select>
        <select value={fashion} onChange={(e) => setFashion(e.target.value)}>
          <option value="">패션 필터</option>
          <option value="true">fashion 적합</option>
          <option value="false">fashion 비적합</option>
        </select>
        <select value={pf} onChange={(e) => setPf(e.target.value)}>
          <option value="">조각찾기 전역 제외</option>
          <option value="true">제외됨</option>
          <option value="false">포함</option>
        </select>
        <button type="button" className="btn" onClick={() => void load()}>
          검색
        </button>
        {urlPostId ? (
          <span className="muted" style={{ alignSelf: 'center' }}>
            URL 게시물 필터 · <Link to="/posts">해제</Link>
          </span>
        ) : null}
      </div>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      <div className="split">
        <div>
          {data && data.items.length === 0 ? <div className="empty-box">결과 없음</div> : null}
          {data && data.items.length > 0 ? (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th />
                    <th>작성자</th>
                    <th>타입</th>
                    <th>상태</th>
                    <th>패션</th>
                    <th>조각 제외</th>
                    <th>캡션</th>
                    {can('posts:write') ? <th>액션</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id} onClick={() => setSel(p)} style={{ cursor: 'pointer' }}>
                      <td>{p.thumb_url ? <img className="thumb" src={p.thumb_url} alt="" /> : '—'}</td>
                      <td>{p.author.nickname ?? '—'}</td>
                      <td>{p.post_type}</td>
                      <td>
                        <span className="badge">{p.status}</span>
                      </td>
                      <td>{p.fashion_eligible ? <span className="badge badge-ok">Y</span> : <span className="badge badge-warn">N</span>}</td>
                      <td>{p.piece_find_globally_excluded ? 'Y' : '—'}</td>
                      <td style={{ maxWidth: 200 }}>{p.caption ?? '—'}</td>
                      {can('posts:write') ? (
                        <td onClick={(e) => e.stopPropagation()}>
                          {p.status === 'active' ? (
                            <button type="button" className="btn btn-danger" onClick={() => void hide(p.id)}>
                              숨김
                            </button>
                          ) : (
                            <button type="button" className="btn" onClick={() => void restore(p.id)}>
                              복구
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
        </div>
        <aside className="panel">
          <h3>상세 / 플래그</h3>
          {!sel ? <p className="muted">행을 선택하세요.</p> : null}
          {sel ? (
            <>
              <div className="muted" style={{ fontSize: 11 }}>
                ID
              </div>
              <code style={{ wordBreak: 'break-all' }}>{sel.id}</code>
              <div className="muted" style={{ fontSize: 11, marginTop: 10 }}>
                무드 태그
              </div>
              <div>{sel.mood_tags.map((m) => m.name).join(', ') || '—'}</div>
              {can('posts:write') ? (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void setFlags(sel.id, { fashion_eligible: !sel.fashion_eligible })}
                  >
                    패션 적합 토글 → {!sel.fashion_eligible ? '적합' : '비적합'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      void setFlags(sel.id, {
                        piece_find_globally_excluded: !sel.piece_find_globally_excluded,
                      })
                    }
                  >
                    조각찾기 전역 제외 토글
                  </button>
                </div>
              ) : (
                <p className="muted" style={{ marginTop: 12 }}>
                  쓰기 권한 없음
                </p>
              )}
            </>
          ) : null}
        </aside>
      </div>
    </>
  );
}
