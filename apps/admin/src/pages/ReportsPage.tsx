import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, adminAction } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type TargetOperator = {
  headline: string;
  sub: string | null;
  thumb_url: string | null;
  links: { posts?: string; users?: string; letters?: string };
};

type ReportRow = {
  id: string;
  status: string;
  reason_code: string;
  target_type: string;
  target_id: string;
  detail_text: string | null;
  created_at: string;
  reporter: { id: string; nickname: string | null };
  target_operator: TargetOperator | null;
};

type List = { total: number; items: ReportRow[]; page: number; page_size: number };

export function ReportsPage() {
  const { can } = useAuth();
  const [status, setStatus] = useState<string>('');
  const [data, setData] = useState<List | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('reports:read')) return;
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams({ page: '1', page_size: '40' });
      if (status) q.set('status', status);
      const d = await apiFetch<List>(`/admin/reports?${q}`);
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }, [can, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action_type: string, id: string) {
    if (!can('reports:write')) return;
    const label =
      action_type === 'resolve_report'
        ? '이 신고를 해결 처리합니다.'
        : action_type === 'dismiss_report'
          ? '이 신고를 기각합니다.'
          : '검토 중으로 표시합니다.';
    if (!window.confirm(`${label} 계속할까요?`)) return;
    try {
      await adminAction({
        action_type,
        target_type: 'report',
        target_id: id,
      });
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '실패');
    }
  }

  async function bundleAct(
    action_type: 'hide_report_target_post' | 'suspend_report_target_user',
    reportId: string,
    label: string,
  ) {
    if (!can('reports:write')) return;
    if (!window.confirm(label)) return;
    try {
      await adminAction({
        action_type,
        target_type: 'report',
        target_id: reportId,
      });
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '실패');
    }
  }

  if (!can('reports:read')) {
    return <div className="restricted">신고 목록 권한이 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">신고</h1>
      <p className="page-desc">
        대상 맥락·딥링크·권장 조치로 클릭 수를 줄입니다. 해결·기각 전 항상 원문을 확인하세요. 조치는 감사 로그에 남습니다.
      </p>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="submitted">submitted</option>
          <option value="reviewing">reviewing</option>
          <option value="resolved">resolved</option>
          <option value="dismissed">dismissed</option>
        </select>
        <button type="button" className="btn" onClick={() => void load()}>
          새로고침
        </button>
      </div>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {!loading && data && data.items.length === 0 ? <div className="empty-box">신고 없음</div> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>상태</th>
                <th>사유</th>
                <th>대상</th>
                <th>운영 뷰</th>
                <th>이동</th>
                <th>신고자</th>
                <th>메모</th>
                <th>시간</th>
                {can('reports:write') ? <th>액션</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="badge">{r.status}</span>
                  </td>
                  <td>{r.reason_code}</td>
                  <td>
                    <span className="muted">{r.target_type}</span>{' '}
                    <code title={r.target_id}>{r.target_id.slice(0, 8)}…</code>
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    {r.target_operator ? (
                      <>
                        <div style={{ fontWeight: 600 }}>{r.target_operator.headline}</div>
                        {r.target_operator.sub ? (
                          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                            {r.target_operator.sub}
                          </div>
                        ) : null}
                        {r.target_operator.thumb_url ? (
                          <img
                            className="thumb"
                            src={r.target_operator.thumb_url}
                            alt=""
                            style={{ marginTop: 6 }}
                          />
                        ) : null}
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      {r.target_operator?.links.posts ? (
                        <Link className="btn" style={{ fontSize: 12, padding: '4px 8px' }} to={r.target_operator.links.posts}>
                          게시물
                        </Link>
                      ) : null}
                      {r.target_operator?.links.users ? (
                        <Link className="btn" style={{ fontSize: 12, padding: '4px 8px' }} to={r.target_operator.links.users}>
                          사용자
                        </Link>
                      ) : null}
                      {r.target_operator?.links.letters ? (
                        <Link className="btn" style={{ fontSize: 12, padding: '4px 8px' }} to={r.target_operator.links.letters}>
                          편지 요청
                        </Link>
                      ) : null}
                      {!r.target_operator?.links.posts &&
                      !r.target_operator?.links.users &&
                      !r.target_operator?.links.letters ? (
                        <span className="muted">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td>{r.reporter.nickname ?? r.reporter.id.slice(0, 8)}</td>
                  <td style={{ maxWidth: 200 }}>{r.detail_text ?? '—'}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  {can('reports:write') ? (
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        <button type="button" className="btn" onClick={() => void act('start_report_review', r.id)}>
                          검토
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => void act('resolve_report', r.id)}>
                          해결
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => void act('dismiss_report', r.id)}>
                          기각
                        </button>
                        {r.target_type === 'post' ? (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              void bundleAct(
                                'hide_report_target_post',
                                r.id,
                                '신고 대상 게시물을 숨기고 이 신고를 해결 처리합니다. 계속할까요?',
                              )
                            }
                          >
                            대상 게시물 숨김
                          </button>
                        ) : null}
                        {r.target_type === 'user' ? (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              void bundleAct(
                                'suspend_report_target_user',
                                r.id,
                                '신고 대상 사용자를 정지하고 이 신고를 해결 처리합니다. 계속할까요?',
                              )
                            }
                          >
                            대상 사용자 정지
                          </button>
                        ) : null}
                      </div>
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
