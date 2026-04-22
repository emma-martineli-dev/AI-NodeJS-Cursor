import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export type StatusVariant = 'success' | 'destructive' | 'warning' | 'secondary';

export function statusToVariant(status: string): StatusVariant {
  switch (status) {
    case 'completed': return 'success';
    case 'failed':    return 'destructive';
    case 'running':   return 'warning';
    default:          return 'secondary';
  }
}
