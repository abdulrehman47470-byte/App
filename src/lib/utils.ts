import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function ageFromDob(dob: string, today = new Date()): number {
  const d = new Date(dob + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return NaN;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export const MIN_AGE = 21;
export const isOfAge = (dob: string, today?: Date) => ageFromDob(dob, today) >= MIN_AGE;

export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "5m ago", "just now", or "on Mar 3" for older dates. */
export function ago(iso: string): string {
  const t = timeAgo(iso);
  return t === 'now' ? 'just now' : /\d[mhd]$/.test(t) ? `${t} ago` : `on ${t}`;
}

export const clockTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
