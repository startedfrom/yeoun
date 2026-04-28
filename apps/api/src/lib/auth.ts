import jwt from 'jsonwebtoken';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../env.js';
import { prisma } from './prisma.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    request.userId = decoded.userId;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

/** JWT userId가 DB에 없으면(다른 DB 연결·시드 리셋·옛 토큰) FK 500 대신 401 */
export async function requireAuthUserExists(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) return;

  const user = await prisma.user.findFirst({
    where: {
      id: request.userId,
      deletedAt: null,
      status: 'active'
    },
    select: { id: true }
  });

  if (!user) {
    return reply.status(401).send({
      error: '이 기기의 로그인 정보가 서버와 맞지 않아요. 다시 로그인해 주세요.',
      code: 'session_user_missing'
    });
  }
}
