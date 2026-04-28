import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import type { FastifyPluginAsync } from 'fastify';

import { env } from '../env.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  nickname: z.string().min(2).max(30),
  bio: z.string().max(160).optional(),
  interest_mood_tag_ids: z.array(z.string()).min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1)
});

function generateTokens(userId: string) {
  const access_token = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '1h' });
  const refresh_token = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '30d' });
  return { access_token, refresh_token };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/signup', async (request, reply) => {
    const payload = signupSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (existingUser) {
      return reply.status(409).send({ error: 'Email already exists' });
    }

    const existingProfile = await prisma.userProfile.findUnique({
      where: { nickname: payload.nickname }
    });

    if (existingProfile) {
      return reply.status(409).send({ error: 'Nickname already exists' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        profile: {
          create: {
            nickname: payload.nickname,
            bio: payload.bio ?? ''
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Try to connect mood tags if valid UUIDs (ignore invalid ones for now)
    const validTags = payload.interest_mood_tag_ids.filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    );
    if (validTags.length > 0) {
      await prisma.userInterestMoodTag.createMany({
        data: validTags.map((tagId) => ({
          userId: user.id,
          moodTagId: tagId
        })),
        skipDuplicates: true
      });
    }

    const tokens = generateTokens(user.id);

    return success({
      user: {
        email: user.email!,
        nickname: user.profile!.nickname,
        bio: user.profile!.bio ?? '',
        onboarding_completed: true
      },
      ...tokens
    });
  });

  app.post('/auth/login', async (request, reply) => {
    const payload = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return reply.status(403).send({ error: 'Account is not active' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const tokens = generateTokens(user.id);

    return success({
      email: user.email!,
      ...tokens
    });
  });

  app.post('/auth/refresh', async (request, reply) => {
    const payload = refreshSchema.parse(request.body);

    try {
      const decoded = jwt.verify(payload.refresh_token, env.JWT_SECRET) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const tokens = generateTokens(user.id);

      return success(tokens);
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired refresh token' });
    }
  });

  app.post('/auth/logout', async () => {
    // With stateless JWTs, true logout requires a blacklist,
    // but for this phase, clearing tokens on client is standard.
    return success({
      message: 'Logged out successfully'
    });
  });
};
