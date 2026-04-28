import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '../generated/prisma/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** `requireAdmin` 이후 채워짐. 라우트별 권한 검사에 사용 */
    adminPermissions?: readonly string[];
  }
}

/** `/admin/me` 와 동일한 스코프 문자열. 향후 역할별 부분 집합은 `permissionsForUserRole` 에서 분기 */
export const ADMIN_FULL_PERMISSIONS = [
  'dashboard:read',
  'users:read',
  'users:write',
  'posts:read',
  'posts:write',
  'chalna:read',
  'letters:read',
  'letters:write',
  'reports:read',
  'reports:write',
  'hashtags:read',
  'hashtags:write',
  'payments:read',
  'piece_find:read',
  'piece_find:write',
  'audit:read',
  'settings:read'
] as const;

/** 신고·목록 조회 위주. 게시물/유저/편지/태그 변경 권한 없음 */
export const MODERATOR_PERMISSIONS = [
  'dashboard:read',
  'users:read',
  'posts:read',
  'chalna:read',
  'letters:read',
  'reports:read',
  'reports:write',
  'hashtags:read',
  'payments:read',
  'piece_find:read',
  'audit:read',
  'settings:read'
] as const;

export function isStaffRole(role: UserRole): boolean {
  return role === 'admin' || role === 'moderator';
}

export function permissionsForUserRole(role: UserRole): readonly string[] {
  if (role === 'admin') return ADMIN_FULL_PERMISSIONS;
  if (role === 'moderator') return MODERATOR_PERMISSIONS;
  return [];
}

export function requireAdminPermission(...required: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const granted = request.adminPermissions;
    if (!granted) {
      return reply.status(500).send({ error: 'Admin permissions not loaded' });
    }
    for (const scope of required) {
      if (!granted.includes(scope)) {
        return reply.status(403).send({ error: 'Forbidden', missing_permission: scope });
      }
    }
  };
}

/** 나열된 스코프 중 하나만 있으면 통과(예: 게시물 목록 = posts:read 또는 chalna:read) */
export function requireAdminPermissionAny(...oneOf: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const granted = request.adminPermissions;
    if (!granted) {
      return reply.status(500).send({ error: 'Admin permissions not loaded' });
    }
    if (!oneOf.some((scope) => granted.includes(scope))) {
      return reply.status(403).send({ error: 'Forbidden', missing_any_of: oneOf });
    }
  };
}

