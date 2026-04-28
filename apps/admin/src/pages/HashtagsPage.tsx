import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

type Tag = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  editorial_slot: string | null;
};

export function HashtagsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Tag[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('hashtags:read')) return;
    setLoading(true);
    try {
      const d = await apiFetch<{ items: Tag[] }>('/admin/mood-tags');
      setItems(d.items);
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

  async function save(
    row: Tag,
    patch: Partial<{
      name: string;
      slug: string;
      display_order: number;
      is_active: boolean;
      editorial_slot: string | null;
    }>,
  ) {
    if (!can('hashtags:write')) return;
    try {
      const body: Record<string, unknown> = {
        display_order: patch.display_order ?? row.display_order,
        is_active: patch.is_active ?? row.is_active,
        editorial_slot: patch.editorial_slot !== undefined ? patch.editorial_slot : row.editorial_slot,
      };
      if (patch.name !== undefined) body.name = patch.name;
      if (patch.slug !== undefined) body.slug = patch.slug;
      await apiFetch(`/admin/mood-tags/${row.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '저장 실패');
    }
  }

  if (!can('hashtags:read')) {
    return <div className="restricted">무드 태그 조회 권한이 없습니다.</div>;
  }

  return (
    <>
      <h1 className="page-title">무드 태그 · 해시 운영</h1>
      <p className="page-desc">
        오늘의·급상승·마이너 슬롯은 <code>editorial_slot</code> 필드로 매핑합니다(today / rising / minor). 노출 순서는 display_order,
        비활성은 피드 후보에서 제외됩니다.
      </p>
      {err ? <div className="error-box">{err}</div> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {!loading && items.length === 0 ? <div className="empty-box">태그 없음</div> : null}
      {items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>이름</th>
                <th>slug</th>
                <th>순서</th>
                <th>활성</th>
                <th>에디토리얼 슬롯</th>
                {can('hashtags:write') ? <th>저장</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <TagRow key={t.id} tag={t} canWrite={can('hashtags:write')} onSave={save} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

function TagRow({
  tag,
  canWrite,
  onSave,
}: {
  tag: Tag;
  canWrite: boolean;
  onSave: (
    t: Tag,
    p: Partial<{ name: string; slug: string; display_order: number; is_active: boolean; editorial_slot: string | null }>,
  ) => void;
}) {
  const [name, setName] = useState(tag.name);
  const [slug, setSlug] = useState(tag.slug);
  const [order, setOrder] = useState(String(tag.display_order));
  const [active, setActive] = useState(tag.is_active);
  const [slot, setSlot] = useState(tag.editorial_slot ?? '');

  useEffect(() => {
    setName(tag.name);
    setSlug(tag.slug);
    setOrder(String(tag.display_order));
    setActive(tag.is_active);
    setSlot(tag.editorial_slot ?? '');
  }, [tag]);

  return (
    <tr>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canWrite} style={{ minWidth: 120 }} />
      </td>
      <td>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={!canWrite}
          style={{ minWidth: 100, fontFamily: 'monospace', fontSize: 12 }}
        />
      </td>
      <td>
        <input
          style={{ width: 64 }}
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          disabled={!canWrite}
        />
      </td>
      <td>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} disabled={!canWrite} />
      </td>
      <td>
        <select value={slot} onChange={(e) => setSlot(e.target.value)} disabled={!canWrite}>
          <option value="">(없음)</option>
          <option value="today">today (오늘의)</option>
          <option value="rising">rising (급상승)</option>
          <option value="minor">minor (마이너)</option>
        </select>
      </td>
      {canWrite ? (
        <td>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const nextName = name.trim() || tag.name;
              const nextSlug = slug.trim() || tag.slug;
              void onSave(tag, {
                ...(nextName !== tag.name ? { name: nextName } : {}),
                ...(nextSlug !== tag.slug ? { slug: nextSlug } : {}),
                display_order: Number(order) || 0,
                is_active: active,
                editorial_slot: slot === '' ? null : slot,
              });
            }}
          >
            저장
          </button>
        </td>
      ) : null}
    </tr>
  );
}
