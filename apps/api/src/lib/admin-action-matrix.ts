/**
 * POST /admin/actions 단일 진실 원천: 허용 (action_type × target_type) 조합 + 필요 권한(AND).
 * 새 액션 추가 시 `ADMIN_ACTION_TYPE_VALUES`·`ADMIN_ACTION_ZOD_TUPLE`(자동)·이 객체를 일치시키고, `pnpm test`(api)로 검증하세요.
 */
export const ADMIN_ACTION_MATRIX = {
  hide_post: { targetTypes: ['post'] as const, permissions: ['posts:write'] as const },
  restore_post: { targetTypes: ['post'] as const, permissions: ['posts:write'] as const },
  set_post_flags: { targetTypes: ['post'] as const, permissions: ['posts:write'] as const },
  suspend_user: { targetTypes: ['user'] as const, permissions: ['users:write'] as const },
  unsuspend_user: { targetTypes: ['user'] as const, permissions: ['users:write'] as const },
  dismiss_report: { targetTypes: ['report'] as const, permissions: ['reports:write'] as const },
  resolve_report: { targetTypes: ['report'] as const, permissions: ['reports:write'] as const },
  start_report_review: { targetTypes: ['report'] as const, permissions: ['reports:write'] as const },
  hide_report_target_post: {
    targetTypes: ['report'] as const,
    permissions: ['reports:write', 'posts:write'] as const
  },
  suspend_report_target_user: {
    targetTypes: ['report'] as const,
    permissions: ['reports:write', 'users:write'] as const
  },
  accept_message_request: {
    targetTypes: ['message_request'] as const,
    permissions: ['letters:write'] as const
  },
  reject_message_request: {
    targetTypes: ['message_request'] as const,
    permissions: ['letters:write'] as const
  }
} as const;

export type AdminMatrixActionType = keyof typeof ADMIN_ACTION_MATRIX;

type MatrixKeys = keyof typeof ADMIN_ACTION_MATRIX;

/** z.enum 용 튜플. `ADMIN_ACTION_MATRIX` 키와 1:1 이어야 함(누락·초과 시 타입 에러). */
export const ADMIN_ACTION_TYPE_VALUES = [
  'hide_post',
  'restore_post',
  'suspend_user',
  'unsuspend_user',
  'dismiss_report',
  'resolve_report',
  'start_report_review',
  'set_post_flags',
  'hide_report_target_post',
  'suspend_report_target_user',
  'accept_message_request',
  'reject_message_request'
] as const satisfies readonly MatrixKeys[];

export function resolveAdminAction(
  action_type: string,
  target_type: string
): { permissions: readonly string[] } | null {
  const row = ADMIN_ACTION_MATRIX[action_type as AdminMatrixActionType];
  if (!row) return null;
  if (!(row.targetTypes as readonly string[]).includes(target_type)) return null;
  return { permissions: row.permissions };
}

/** `z.enum()`용 튜플 — `ADMIN_ACTION_TYPE_VALUES` 순서 유지, 캐스팅 없이 타입 안전 */
function buildAdminActionZodTuple(): [AdminMatrixActionType, ...AdminMatrixActionType[]] {
  const arr = [...ADMIN_ACTION_TYPE_VALUES];
  const [head, ...tail] = arr;
  if (head === undefined || tail.length === 0) {
    throw new Error('ADMIN_ACTION_TYPE_VALUES must list at least two action types');
  }
  return [head, ...tail];
}

export const ADMIN_ACTION_ZOD_TUPLE = buildAdminActionZodTuple();
