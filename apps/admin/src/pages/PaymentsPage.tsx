import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type Letter = {
  id: string;
  payment_reference: string | null;
  created_at: string;
  sender: { nickname: string | null };
  message_request: { initial_message: string | null; status: string } | null;
};

type PaidLettersList = { items: Letter[] };

type OrderRow = {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  amount_minor: number | null;
  currency: string | null;
  external_ref: string | null;
  note: string | null;
  created_at: string;
  payer_nickname: string | null;
  refunds: { id: string; status: string }[];
};

type OrdersList = { total: number; page: number; page_size: number; items: OrderRow[] };

export function PaymentsPage() {
  const { can } = useAuth();
  const [letters, setLetters] = useState<PaidLettersList | null>(null);
  const [orders, setOrders] = useState<OrdersList | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('payments:read')) return;
    setLoading(true);
    setErr(null);
    try {
      const [l, o] = await Promise.all([
        apiFetch<PaidLettersList>('/admin/piece-find/paid-letters?page=1&page_size=50'),
        apiFetch<OrdersList>('/admin/payment-orders?page=1&page_size=50'),
      ]);
      setLetters(l);
      setOrders(o);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '로드 실패');
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!can('payments:read')) {
    return <div className="restricted">결제·권한 화면을 볼 수 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">결제 · 권한</h1>
      <p className="page-desc">
        <code>piece_find_paid_letters</code>는 조각찾기 유료 편지 추적용입니다. <code>payment_orders</code>는 주문·상태·환불
        연계를 위한 최소 도메인 초안입니다(읽기 전용).
      </p>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}

      <h2 className="page-title" style={{ fontSize: 18, marginTop: 24 }}>
        결제 주문
      </h2>
      {orders && orders.items.length === 0 ? <div className="empty-box">주문 없음</div> : null}
      {orders && orders.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>시간</th>
                <th>상태</th>
                <th>provider</th>
                <th>금액</th>
                <th>결제 ref</th>
                <th>사용자</th>
                <th>메모</th>
                <th>환불</th>
              </tr>
            </thead>
            <tbody>
              {orders.items.map((r) => (
                <tr key={r.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge">{r.status}</span>
                  </td>
                  <td>
                    <code>{r.provider}</code>
                  </td>
                  <td>
                    {r.amount_minor != null ? `${r.amount_minor} ${r.currency ?? ''}`.trim() : '—'}
                  </td>
                  <td>
                    <code>{r.external_ref ?? '—'}</code>
                  </td>
                  <td>{r.payer_nickname ?? r.user_id.slice(0, 8)}</td>
                  <td style={{ maxWidth: 220 }}>{r.note ?? '—'}</td>
                  <td>
                    {r.refunds.length === 0 ? (
                      '—'
                    ) : (
                      <span className="muted">{r.refunds.map((x) => x.status).join(', ')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <h2 className="page-title" style={{ fontSize: 18, marginTop: 28 }}>
        조각찾기 유료 편지
      </h2>
      {letters && letters.items.length === 0 ? <div className="empty-box">유료 편지 기록 없음</div> : null}
      {letters && letters.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>시간</th>
                <th>결제 ref</th>
                <th>보낸이</th>
                <th>편지 초안</th>
                <th>요청 상태</th>
              </tr>
            </thead>
            <tbody>
              {letters.items.map((r) => (
                <tr key={r.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td>
                    <code>{r.payment_reference ?? '—'}</code>
                  </td>
                  <td>{r.sender.nickname ?? '—'}</td>
                  <td style={{ maxWidth: 400 }}>{r.message_request?.initial_message ?? '—'}</td>
                  <td>{r.message_request?.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
