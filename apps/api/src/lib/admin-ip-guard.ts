import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../env.js';

const allowlist = (env.ADMIN_IP_ALLOWLIST ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * ADMIN_IP_ALLOWLIST 가 비어 있으면 비활성. 설정 시 클라이언트 IP 가 목록에 없으면 403.
 * 리버스 프록시 뒤에서는 Fastify trustProxy + X-Forwarded-For 를 켜야 request.ip 이 의미 있다.
 */
export async function adminIpAllowlistGuard(request: FastifyRequest, reply: FastifyReply) {
  if (allowlist.length === 0) return;
  const ip = request.ip;
  if (!allowlist.includes(ip)) {
    return reply.status(403).send({ error: 'Admin IP not allowlisted' });
  }
}
