/**
 * 로컬에서 API가 떠 있을 때 RBAC 스모크 (기본 http://127.0.0.1:4000/api/v1).
 * 사용: `pnpm exec tsx scripts/admin-rbac-smoke.ts`
 */
const BASE = process.env.SMOKE_API_BASE ?? 'http://127.0.0.1:4000/api/v1';

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = (await res.json()) as { success?: boolean; data?: { access_token?: string }; error?: string };
  if (!res.ok || !json.success || !json.data?.access_token) {
    throw new Error(`login failed ${email}: ${json.error ?? res.status}`);
  }
  return json.data.access_token;
}

async function api(token: string, path: string, init: RequestInit = {}): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers as object) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  const adminTok = await login('ops@gamdojang.local', '0000');
  const modTok = await login('mod@gamdojang.local', '0000');

  const meA = await api(adminTok, '/admin/me');
  assert(meA.status === 200 && (meA.body as { success?: boolean }).success, 'admin /admin/me');
  const meM = await api(modTok, '/admin/me');
  assert(meM.status === 200, 'moderator /admin/me');
  const modPerms = (meM.body as { data?: { permissions?: string[] } }).data?.permissions ?? [];
  assert(modPerms.includes('reports:write'), 'moderator has reports:write');
  assert(!modPerms.includes('posts:write'), 'moderator lacks posts:write');

  const dash = await api(modTok, '/admin/dashboard');
  assert(dash.status === 200, 'moderator dashboard');

  const reps = await api(modTok, '/admin/reports?page=1&page_size=1');
  assert(reps.status === 200, 'moderator reports read');
  const repId = (reps.body as { data?: { items?: { id: string }[] } }).data?.items?.[0]?.id;
  assert(repId, 'need a report row');

  const start = await api(modTok, '/admin/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action_type: 'start_report_review',
      target_type: 'report',
      target_id: repId,
    }),
  });
  assert(start.status === 200, `moderator start_report_review expected 200 got ${start.status}`);

  const posts = await api(modTok, '/admin/posts?page=1&page_size=1');
  const postId = (posts.body as { data?: { items?: { id: string }[] } }).data?.items?.[0]?.id;
  assert(postId, 'need a post');
  const hide = await api(modTok, '/admin/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_type: 'hide_post', target_type: 'post', target_id: postId }),
  });
  assert(hide.status === 403, `moderator hide_post must be 403, got ${hide.status}`);

  const tags = await api(modTok, '/admin/mood-tags');
  assert(tags.status === 200, 'moderator mood-tags read');
  const tagId = (tags.body as { data?: { items?: { id: string }[] } }).data?.items?.[0]?.id;
  assert(tagId, 'need mood tag');
  const put = await api(modTok, `/admin/mood-tags/${tagId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_order: 0, is_active: true }),
  });
  assert(put.status === 403, `moderator PUT mood-tags must be 403, got ${put.status}`);

  const userTok = await login('cloud@test.com', '0000');
  const denied = await api(userTok, '/admin/me');
  assert(denied.status === 403, 'consumer must not reach admin');

  console.log('admin-rbac-smoke: OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
