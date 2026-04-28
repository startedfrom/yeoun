import { prisma } from './prisma.js';

/** URL·검색용 슬러그. 한글 등은 제거되어 짧은 ASCII 가 된다. */
export function slugifyMoodTagName(name: string): string {
  const ascii = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const base = ascii.length > 0 ? ascii.slice(0, 50) : `tag-${Date.now().toString(36)}`;
  return base;
}

export async function allocateUniqueMoodTagSlug(desired: string, excludeId?: string): Promise<string> {
  let candidate = desired.slice(0, 60);
  let n = 0;
  while (true) {
    const clash = await prisma.moodTag.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {})
      },
      select: { id: true }
    });
    if (!clash) return candidate;
    n += 1;
    const suffix = `-${n}`;
    candidate = `${desired.slice(0, Math.max(1, 60 - suffix.length))}${suffix}`;
  }
}
