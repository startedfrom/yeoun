import { randomUUID } from 'node:crypto';

import type { Prisma } from '../generated/prisma/index.js';

import { containsProfanity } from './filter.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asciiSlugPart(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return s;
}

/**
 * 입력은 기존 무드 태그 UUID이거나, 새로 쓸 태그 이름(해시 # 제거)입니다.
 * 이름이 DB에 없으면 활성 무드 태그로 생성합니다.
 */
export async function resolveMoodTagInput(
  tx: Prisma.TransactionClient,
  raw: string
): Promise<string> {
  const stripped = raw.trim().replace(/^#+/u, '');
  if (!stripped) {
    throw new Error('빈 태그는 붙일 수 없어요.');
  }

  if (containsProfanity(stripped)) {
    throw new Error('무드 태그에 부적절한 표현은 사용할 수 없어요.');
  }

  if (UUID_RE.test(stripped)) {
    const found = await tx.moodTag.findUnique({ where: { id: stripped } });
    if (found) return found.id;
    throw new Error('알 수 없는 무드 태그예요.');
  }

  const name = stripped.slice(0, 40);
  const byName = await tx.moodTag.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } }
  });
  if (byName) return byName.id;

  let slugBase = asciiSlugPart(name);
  if (!slugBase) slugBase = `t-${randomUUID().slice(0, 8)}`;
  let slug = slugBase.slice(0, 55);
  let n = 0;
  while (await tx.moodTag.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${++n}`.slice(0, 60);
  }

  const created = await tx.moodTag.create({
    data: {
      name,
      slug,
      displayOrder: 900 + (Math.floor(Date.now() / 1000) % 9000),
      isActive: true
    }
  });
  return created.id;
}

export async function resolveMoodTagIds(
  tx: Prisma.TransactionClient,
  inputs: string[]
): Promise<string[]> {
  const resolved: string[] = [];
  for (const raw of inputs) {
    resolved.push(await resolveMoodTagInput(tx, raw));
  }
  return [...new Set(resolved)];
}
