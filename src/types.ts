export interface Author {
  id: string;
  nameCn: string;
  nameEn: string;
  ip?: string;
  lifespan?: string;
  profession?: string;
  bio?: string;
  tags?: string[];
  avatarUrl?: string;
}

export interface Quote {
  id: string;
  authorId: string;
  text: string;
  original?: string;
  originalLabel?: string;
  source?: string;
  supplement?: string;
  location?: string;
  note?: string;
  type: 'excerpt' | 'essay';
  createdAt: string;
}

export interface Comment {
  id: string;
  targetId: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface Interaction {
  likes: number;
  favorited: boolean;
}

export interface UserProfile {
  name: string;
  bio: string;
  location?: string;
  avatarUrl?: string;
}

export interface AppState {
  authors: Record<string, Author>;
  quotes: Quote[];
  interactions: Record<string, Interaction>;
  comments: Record<string, Comment[]>;
  userProfile: UserProfile;
  deletedQuoteIds: string[];
  followedAuthorIds: string[];
}

export type AuthorTab = 'notes' | 'likes' | 'collected';
export type MeTab = 'notes' | 'liked' | 'collected' | 'commented';
