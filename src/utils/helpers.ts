/** Pre-resolved Wikipedia portrait URLs (grayscale applied via CSS) */
import type { Author, Interaction, Quote } from '../types';

export const AUTHOR_AVATARS: Record<string, string> = {
  'franz-kafka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Kafka1906_cropped.jpg/320px-Kafka1906_cropped.jpg',
  'anton-pavlovich-chekhov': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Anton_Chekhov_1889.jpg/320px-Anton_Chekhov_1889.jpg',
  'lev-nikolayevich-tolstoy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/L.N.Tolstoy_Prokudin-Gorsky.jpg/320px-L.N.Tolstoy_Prokudin-Gorsky.jpg',
  'oscar-wilde': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Oscar_Wilde_Sarony.jpg/320px-Oscar_Wilde_Sarony.jpg',
  'bertrand-russell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bertrand_Russell_1938.jpg/320px-Bertrand_Russell_1938.jpg',
  'albert-camus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Albert_Camus%2C_gagnant_de_prix_Nobel%2C_portrait_en_buste%2C_pos%C3%A9_au_bureau%2C_faisant_face_%C3%A0_gauche%2C_cigarette_%C3%A0_la_main.jpg/320px-Albert_Camus%2C_gagnant_de_prix_Nobel%2C_portrait_en_buste%2C_pos%C3%A9_au_bureau%2C_faisant_face_%C3%A0_gauche%2C_cigarette_%C3%A0_la_main.jpg',
  'william-somerset-maugham': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Somerset_Maugham_1934.jpg/320px-Somerset_Maugham_1934.jpg',
  'raymond-carver': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Raymond_Carver.jpg/320px-Raymond_Carver.jpg',
  'shu-qingchun': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Lao_She.jpg/320px-Lao_She.jpg',
  'ottessa-moshfegh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ottessa_Moshfegh_2016.jpg/320px-Ottessa_Moshfegh_2016.jpg',
  'abraham-yehoshua': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Avraham_B._Yehoshua.jpg/320px-Avraham_B._Yehoshua.jpg',
  'mu-xin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Mu_Xin_2010.jpg/320px-Mu_Xin_2010.jpg',
  'emil-michel-cioran': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Emil_Cioran.jpg/320px-Emil_Cioran.jpg',
  'charles-bukowski': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Charles_Bukowski_by_Jesse_Simon_%28cropped%29.jpg/320px-Charles_Bukowski_by_Jesse_Simon_%28cropped%29.jpg',
  'daniil-kharms': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Daniil_Kharms.jpg/320px-Daniil_Kharms.jpg',
  'françoise-sagan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Francoise_Sagan_1985.jpg/320px-Francoise_Sagan_1985.jpg',
  'ira-ishida': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Ira_Ishida_2019.jpg/320px-Ira_Ishida_2019.jpg',
  'zhu-shenghao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Zhu_Shenghao.jpg/320px-Zhu_Shenghao.jpg',
  'ji-xianlin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Ji_Xianlin.jpg/320px-Ji_Xianlin.jpg',
  'hu-shi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Hu_Shi_in_1910.jpg/320px-Hu_Shi_in_1910.jpg',
  'marcel-proust': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Marcel_Proust_1900.jpg/320px-Marcel_Proust_1900.jpg',
  'fyodor-dostoevsky': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Vasily_Perov_-_Portrait_of_Fyodor_Dostoyevsky_-_Google_Art_Project.jpg/320px-Vasily_Perov_-_Portrait_of_Fyodor_Dostoyevsky_-_Google_Art_Project.jpg',
  'wang-zengqi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Wang_Zengqi.jpg/320px-Wang_Zengqi.jpg',
  'fumi-yamamoto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Fumi_Yamamoto_2013.jpg/320px-Fumi_Yamamoto_2013.jpg',
  'alexander-pushkin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Kiprensky_Pushkin.jpg/320px-Kiprensky_Pushkin.jpg',
  'orhan-pamuk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Orhan_Pamuk_2009.jpg/320px-Orhan_Pamuk_2009.jpg',
  'yu-hua': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Yu_Hua_2018.jpg/320px-Yu_Hua_2018.jpg',
};

export const ME_AUTHOR_ID = '__me__';

/** Resolve a public/ asset path for current deploy base (GitHub Pages subpath-safe) */
export function publicAssetUrl(path: string): string {
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const clean = path.replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}

export function getInitial(nameCn: string, nameEn: string): string {
  const enParts = nameEn.trim().split(/\s+/).filter(Boolean);
  const firstEn = enParts[0] ?? '';
  const lastEn = enParts[enParts.length - 1] ?? '';
  const useEnglish = enParts.length >= 2 && firstEn.length >= 4 && /^[A-Za-z]/.test(lastEn);

  if (useEnglish) {
    const letter = lastEn.match(/[A-Za-z]/)?.[0];
    if (letter) return letter.toUpperCase();
  }

  const parts = nameCn.split(/[·・]/);
  const last = parts[parts.length - 1]?.replace(/[^\u4e00-\u9fff]/g, '') ?? '';
  if (last) return last.slice(0, 1);
  return nameCn.replace(/[^\u4e00-\u9fff]/g, '').slice(0, 1) || '?';
}

export function getAvatarUrl(authorId: string, _nameCn: string, _nameEn: string, custom?: string): string | null {
  if (custom) return custom;
  return AUTHOR_AVATARS[authorId] ?? null;
}

export function getShortAuthorName(nameCn: string): string {
  const parts = nameCn.split(/[·・]/);
  const last = parts[parts.length - 1]?.trim();
  if (last && last.length <= 6) return last;
  return nameCn.replace(/^[^\u4e00-\u9fff]*/u, '').slice(-3) || nameCn;
}

export function searchAuthors(authors: Author[], query: string): Author[] {
  const q = query.trim().toLowerCase();
  if (!q) return authors;
  return authors.filter((author) => {
    const haystack = [
      author.nameCn,
      author.nameEn,
      author.ip,
      author.profession,
      author.bio,
      ...(author.tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function formatCopyText(text: string, authorName: string): string {
  return `${text}——${getShortAuthorName(authorName)}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()} - ${String(d.getMonth() + 1).padStart(2, '0')} - ${String(d.getDate()).padStart(2, '0')}`;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function uid(): string {
  return crypto.randomUUID();
}

/** Display source exactly as stored — no extra book-title wrappers */
export function formatSource(source?: string): string {
  if (!source) return '';
  return source.trim();
}

export function getFollowedAuthorIds(
  quotes: Quote[],
  interactions: Record<string, Interaction>,
): string[] {
  const ids = new Set<string>();
  for (const q of quotes) {
    if (q.type === 'excerpt' && q.authorId !== ME_AUTHOR_ID && interactions[q.id]?.favorited) {
      ids.add(q.authorId);
    }
  }
  return [...ids];
}
