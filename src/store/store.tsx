import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import defaultData from '../data/default-data.json';
import type { AppState, Author, Comment, Interaction, Quote, UserProfile } from '../types';
import { normalizeAuthorMeta } from '../utils/authorMeta';
import { ME_AUTHOR_ID, uid, getFollowedAuthorIds } from '../utils/helpers';

const STORAGE_KEY = 'xiaohhenshu-state-v1';

const defaultUserProfile: UserProfile = {
  name: '自己的名字',
  bio: '个性签名',
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
    return {
      ...initial,
      ...parsed,
      authors: mergedAuthors,
      quotes: [...parsed.quotes, ...newDefaults],
      userProfile: { ...defaultUserProfile, ...parsed.userProfile },
      deletedQuoteIds: parsed.deletedQuoteIds ?? [],
      followedAuthorIds: parsed.followedAuthorIds ?? [],
    };
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
