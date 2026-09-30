import type { UserType } from '@/types';

export const USER_TYPES: { id: UserType; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'aficionado', label: 'Aficionado' },
  { id: 'collector', label: 'Collector' },
];

export const userTypeLabel = (t?: UserType) => USER_TYPES.find((u) => u.id === t)?.label ?? '';
