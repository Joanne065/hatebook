const ZODIAC_RE = /(白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座)/;

export function splitLifespanAndZodiac(lifespan?: string): { lifespan: string; zodiac?: string } {
  if (!lifespan) return { lifespan: '' };
  const match = lifespan.match(ZODIAC_RE);
  if (!match) return { lifespan: cleanLifespanText(lifespan) };
  const zodiac = match[1];
  const cleaned = lifespan.replace(zodiac, '');
  return { lifespan: cleanLifespanText(cleaned), zodiac };
}

/** Remove empty brackets, orphaned zodiac placeholders, etc. */
export function cleanLifespanText(text: string): string {
  return text
    .replace(/（\s*）/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/至今（）/g, '至今')
    .replace(/至今\(\)/g, '至今')
    .replace(/\s+（/g, '（')
    .replace(/）\s+/g, '）')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getAuthorDisplayTags(author: { tags?: string[]; lifespan?: string }): string[] {
  const { zodiac } = splitLifespanAndZodiac(author.lifespan);
  const tags = [...(author.tags ?? [])];
  if (zodiac && !tags.includes(zodiac)) tags.unshift(zodiac);
  return tags;
}

export function getAuthorLifespanDisplay(lifespan?: string): string {
  return splitLifespanAndZodiac(lifespan).lifespan;
}

export function normalizeAuthorMeta<T extends { lifespan?: string; tags?: string[] }>(author: T): T {
  const { lifespan, zodiac } = splitLifespanAndZodiac(author.lifespan);
  const tags = [...(author.tags ?? [])];
  if (zodiac && !tags.includes(zodiac)) tags.unshift(zodiac);
  return { ...author, lifespan: lifespan || undefined, tags };
}
