import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import defaultData from '../data/default-data.json';
import type { AppState, Author, Comment, Interaction, Quote, UserProfile } from '../types';
import { normalizeAuthorMeta } from '../utils/authorMeta';
import { ME_AUTHOR_ID, uid, getFollowedAuthorIds } from '../utils/helpers';

const STORAGE_KEY = 'xiaohhenshu-state-v1';

/** Metadata lines wrongly imported as quotes during docx merge */
const CORRUPT_QUOTE_IDS = new Set([
  'd5675124-c4b7-4fd6-98dc-e2cfc4f4a615',
  'eea2cc47-8092-49b5-9e82-925fff80c9b6',
  'a7248b01-6cb2-4ff3-b7b5-c17d9f9dc97f',
  '419b7a24-2635-4cc1-8a1e-0012c0fdd493',
  '0697a29e-e86b-4798-b50d-e5edfe40281b',
  'd90a92ab-db3c-415e-981c-12e5791b0d93',
  'b2278f01-69e0-4c33-8e89-2bcdbfd0237d',
  'bde4d97e-3b8a-4152-91fd-94292cf19281',
  '176e6c31-976c-4b60-bcac-1f4d55a006de',
  'd04143ba-2dbb-4a2f-a8fd-27d80fd934c1',
  '0eb4003a-79fb-481c-bf69-923ee290d51b',
]);

const DAZAI_QUOTE_IDS = new Set([
  'ee76caed-0e81-4643-ac5d-f9a813d031b6',
  '77199965-ab49-4ea4-9eea-728d34aa8a6f',
  '1c605688-c648-4e50-a11e-0645c7a3f979',
  '80298088-7e79-414f-98d0-c3fa2cd178c0',
  '5fb0a2a5-a84d-43fc-82b3-9fdae2ab367f',
  'f601978c-a778-45bd-b665-4db2f1b88e98',
]);

const MIN_QUOTE_ID = 'fa6103d4-9a19-4074-a4d4-23524ac7c717';
const XIAO_HONG_ESSAY_QUOTE_ID = '2f8c1733-97eb-416d-9acd-549f172548e3';

const YU_GUANGZHONG_QUOTE_IDS = new Set([
  'a27b4d6d-2c42-4a50-8219-64745f9d9484',
  '39ba2122-bd78-4b20-93d7-1f71184a5898',
]);

function migrateCorruptedAuthors(state: AppState, initial: AppState): AppState {
  const authors = { ...state.authors };
  if (initial.authors['osamu-dazai']) authors['osamu-dazai'] = initial.authors['osamu-dazai'];
  if (initial.authors['min-ji-hyeong']) authors['min-ji-hyeong'] = initial.authors['min-ji-hyeong'];
  if (initial.authors['yu-guangzhong']) authors['yu-guangzhong'] = initial.authors['yu-guangzhong'];

  const quotes = state.quotes
    .filter((q) => !CORRUPT_QUOTE_IDS.has(q.id))
    .map((q) => {
      if (q.id === XIAO_HONG_ESSAY_QUOTE_ID) {
        return { ...q, source: '随笔' };
      }
      if (DAZAI_QUOTE_IDS.has(q.id)) {
        return { ...q, authorId: 'osamu-dazai' };
      }
      if (q.id === MIN_QUOTE_ID) {
        return { ...q, authorId: 'min-ji-hyeong' };
      }
      if (YU_GUANGZHONG_QUOTE_IDS.has(q.id)) {
        return { ...q, authorId: 'yu-guangzhong' };
      }
      return q;
    });

  const quoteIds = new Set(quotes.map((q) => q.id));
  for (const q of initial.quotes) {
    if ((DAZAI_QUOTE_IDS.has(q.id) || q.id === MIN_QUOTE_ID || YU_GUANGZHONG_QUOTE_IDS.has(q.id)) && !quoteIds.has(q.id)) {
      quotes.push(q);
    }
  }

  return {
    ...state,
    authors,
    quotes,
    deletedQuoteIds: (state.deletedQuoteIds ?? []).filter((id) => !CORRUPT_QUOTE_IDS.has(id)),
  };
}

const defaultUserProfile: UserProfile = {
  name: 'momo',
  bio: '这个人很懒，可能还没想好吧！',
  location: '',
};

function buildInitialState(): AppState {
  const authors: Record<string, Author> = {};
  const quotes: Quote[] = [];
  const now = new Date().toISOString();

  for (const a of defaultData.authors) {
    const { quotes: authorQuotes, ...authorRest } = a;
    authors[a.id] = normalizeAuthorMeta({ ...authorRest });
    for (const q of authorQuotes) {
      quotes.push({
        id: q.id,
        authorId: a.id,
        text: q.text,
        original: q.original || undefined,
        originalLabel: q.originalLabel || undefined,
        source: q.source || undefined,
        type: 'excerpt',
        createdAt: now,
      });
    }
  }

  return {
    authors,
    quotes,
    interactions: {},
    comments: {},
    userProfile: defaultUserProfile,
    deletedQuoteIds: [],
    followedAuthorIds: [],
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as AppState;
    const initial = buildInitialState();
    const mergedAuthors: Record<string, Author> = {};
    for (const [id, a] of Object.entries({ ...initial.authors, ...parsed.authors })) {
      mergedAuthors[id] = normalizeAuthorMeta(a);
    }
    const existingIds = new Set(parsed.quotes.map((q) => q.id));
    const newDefaults = initial.quotes.filter((q) => !existingIds.has(q.id));
    return migrateCorruptedAuthors({
      ...initial,
      ...parsed,
      authors: mergedAuthors,
      quotes: [...parsed.quotes, ...newDefaults],
      userProfile: {
        ...defaultUserProfile,
        ...parsed.userProfile,
        ...(parsed.userProfile.name === '自己的名字'
          ? { name: defaultUserProfile.name, bio: defaultUserProfile.bio }
          : {}),
      },
      deletedQuoteIds: parsed.deletedQuoteIds ?? [],
      followedAuthorIds: parsed.followedAuthorIds ?? [],
    }, initial);
  } catch {
    return buildInitialState();
  }
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function defaultInteraction(): Interaction {
  return { likes: 0, favorited: false };
}

interface StoreContextValue {
  state: AppState;
  getAuthor: (id: string) => Author | undefined;
  getQuote: (id: string) => Quote | undefined;
  getInteraction: (id: string) => Interaction;
  getComments: (id: string) => Comment[];
  likeQuote: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addComment: (targetId: string, text: string) => void;
  deleteComment: (targetId: string, commentId: string) => void;
  likeComment: (targetId: string, commentId: string) => void;
  addExcerpt: (author: Partial<Author> & { nameCn: string; nameEn: string }, quote: Partial<Quote> & { text: string }) => string;
  addEssay: (data: { text: string; supplement?: string; location?: string }) => string;
  updateAuthor: (id: string, patch: Partial<Author>) => void;
  updateUserProfile: (patch: Partial<UserProfile>) => void;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  deleteQuotes: (ids: string[]) => void;
  followedAuthorIds: string[];
  isFollowing: (id: string) => boolean;
  resetToDefault: () => void;
  visibleQuotes: Quote[];
  excerptQuotes: Quote[];
  essayQuotes: Quote[];
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = (fn: (s: AppState) => AppState) => setState((s) => fn(s));

  const visibleQuotes = useMemo(
    () => state.quotes.filter((q) => !state.deletedQuoteIds.includes(q.id)),
    [state.quotes, state.deletedQuoteIds],
  );

  const excerptQuotes = useMemo(
    () => visibleQuotes.filter((q) => q.type === 'excerpt'),
    [visibleQuotes],
  );

  const essayQuotes = useMemo(
    () => visibleQuotes.filter((q) => q.type === 'essay'),
    [visibleQuotes],
  );

  const followedAuthorIds = useMemo(
    () => getFollowedAuthorIds(visibleQuotes, state.interactions),
    [visibleQuotes, state.interactions],
  );

  const value: StoreContextValue = {
    state,
    getAuthor: (id) => {
      if (id === ME_AUTHOR_ID) {
        return {
          id: ME_AUTHOR_ID,
          nameCn: state.userProfile.name,
          nameEn: state.userProfile.name,
          bio: state.userProfile.bio,
          ip: state.userProfile.location,
          avatarUrl: state.userProfile.avatarUrl,
        } as Author;
      }
      return state.authors[id];
    },
    getQuote: (id) => visibleQuotes.find((q) => q.id === id),
    getInteraction: (id) => state.interactions[id] ?? defaultInteraction(),
    getComments: (id) => state.comments[id] ?? [],
    likeQuote: (id) =>
      update((s) => ({
        ...s,
        interactions: {
          ...s.interactions,
          [id]: { ...(s.interactions[id] ?? defaultInteraction()), likes: (s.interactions[id]?.likes ?? 0) + 1 },
        },
      })),
    toggleFavorite: (id) =>
      update((s) => {
        const cur = s.interactions[id] ?? defaultInteraction();
        return {
          ...s,
          interactions: { ...s.interactions, [id]: { ...cur, favorited: !cur.favorited } },
        };
      }),
    addComment: (targetId, text) =>
      update((s) => {
        const list = s.comments[targetId] ?? [];
        const comment: Comment = { id: uid(), targetId, text, createdAt: new Date().toISOString(), likes: 0 };
        return { ...s, comments: { ...s.comments, [targetId]: [...list, comment] } };
      }),
    deleteComment: (targetId, commentId) =>
      update((s) => ({
        ...s,
        comments: {
          ...s.comments,
          [targetId]: (s.comments[targetId] ?? []).filter((c) => c.id !== commentId),
        },
      })),
    likeComment: (targetId, commentId) =>
      update((s) => ({
        ...s,
        comments: {
          ...s.comments,
          [targetId]: (s.comments[targetId] ?? []).map((c) =>
            c.id === commentId ? { ...c, likes: c.likes + 1 } : c,
          ),
        },
      })),
    addExcerpt: (authorData, quoteData) => {
      const quoteId = uid();
      update((s) => {
        let authorId = Object.values(s.authors).find(
          (a) => a.nameCn === authorData.nameCn || a.nameEn === authorData.nameEn,
        )?.id;
        const authors = { ...s.authors };
        if (!authorId) {
          authorId = authorData.nameEn.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || uid();
          authors[authorId] = {
            id: authorId,
            nameCn: authorData.nameCn,
            nameEn: authorData.nameEn,
            ip: authorData.ip,
            lifespan: authorData.lifespan,
            profession: authorData.profession,
            bio: authorData.bio,
            tags: authorData.tags,
            avatarUrl: authorData.avatarUrl,
          };
        } else {
          authors[authorId] = { ...authors[authorId], ...authorData, id: authorId };
        }
        const quote: Quote = {
          id: quoteId,
          authorId,
          text: quoteData.text,
          original: quoteData.original,
          originalLabel: quoteData.originalLabel,
          source: quoteData.source,
          note: quoteData.note,
          type: 'excerpt',
          createdAt: new Date().toISOString(),
        };
        return { ...s, authors, quotes: [quote, ...s.quotes] };
      });
      return quoteId;
    },
    addEssay: (data) => {
      const quoteId = uid();
      update((s) => {
        const quote: Quote = {
          id: quoteId,
          authorId: ME_AUTHOR_ID,
          text: data.text,
          supplement: data.supplement,
          location: data.location,
          type: 'essay',
          createdAt: new Date().toISOString(),
        };
        return { ...s, quotes: [quote, ...s.quotes] };
      });
      return quoteId;
    },
    updateAuthor: (id, patch) =>
      update((s) => ({ ...s, authors: { ...s.authors, [id]: { ...s.authors[id], ...patch } } })),
    updateUserProfile: (patch) =>
      update((s) => ({ ...s, userProfile: { ...s.userProfile, ...patch } })),
    updateQuote: (id, patch) =>
      update((s) => ({ ...s, quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
    deleteQuotes: (ids) =>
      update((s) => ({
        ...s,
        deletedQuoteIds: [...new Set([...s.deletedQuoteIds, ...ids])],
      })),
    followedAuthorIds,
    isFollowing: (id) => followedAuthorIds.includes(id),
    resetToDefault: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState(buildInitialState());
    },
    visibleQuotes,
    excerptQuotes,
    essayQuotes,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function searchQuotes(quotes: Quote[], authors: Record<string, Author>, query: string): Quote[] {
  const q = query.trim().toLowerCase();
  if (!q) return quotes;
  return quotes.filter((quote) => {
    const author = authors[quote.authorId];
    const haystack = [
      quote.text,
      quote.original,
      quote.source,
      quote.supplement,
      quote.location,
      quote.note,
      author?.nameCn,
      author?.nameEn,
      author?.bio,
      ...(author?.tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
