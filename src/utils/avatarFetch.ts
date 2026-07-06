const AVATAR_CACHE_KEY = 'xiaohhenshu-avatar-cache';

type AvatarCache = Record<string, string>;

function readCache(): AvatarCache {
  try {
    return JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) ?? '{}') as AvatarCache;
  } catch {
    return {};
  }
}

function writeCache(cache: AvatarCache) {
  localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
}

function wikiTitles(nameEn: string, nameCn: string): string[] {
  const titles = new Set<string>();
  const en = nameEn.trim().split('/')[0].trim();
  if (en && /^[A-Za-z]/.test(en)) titles.add(en);
  const cnPart = nameCn.split(/[·・]/).pop()?.trim();
  if (cnPart) titles.add(cnPart);
  titles.add(nameCn.split(/[·・]/)[0]?.trim() ?? nameCn);
  return [...titles].filter(Boolean);
}

async function fetchFromWiki(title: string): Promise<string | null> {
  for (const lang of ['en', 'zh']) {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { thumbnail?: { source: string } };
      if (data.thumbnail?.source) return data.thumbnail.source;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export async function fetchAuthorAvatar(authorId: string, nameCn: string, nameEn: string): Promise<string | null> {
  const cache = readCache();
  if (cache[authorId]) return cache[authorId];

  for (const title of wikiTitles(nameEn, nameCn)) {
    const url = await fetchFromWiki(title);
    if (url) {
      cache[authorId] = url;
      writeCache(cache);
      return url;
    }
  }
  return null;
}

export function getCachedAvatar(authorId: string): string | null {
  return readCache()[authorId] ?? null;
}

export function setCachedAvatar(authorId: string, url: string) {
  const cache = readCache();
  cache[authorId] = url;
  writeCache(cache);
}
