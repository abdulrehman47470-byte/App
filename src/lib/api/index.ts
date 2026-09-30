import { mockProvider } from './mock';
import type { DataProvider } from './types';

// Phase 1 adds: if (import.meta.env.VITE_DATA_PROVIDER === 'supabase') return supabaseProvider;
export const api: DataProvider = mockProvider;

export type { DataProvider, LoungeQuery, MentorSegment, NewPost } from './types';
