import { cn } from '@/lib/utils';

interface ToastProps {
  kind: 'success' | 'error';
  message: string;
}

export function Toast({ kind, message }: ToastProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-md px-4 py-2 text-sm font-medium border',
        kind === 'success'
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-red-50 text-red-800 border-red-200',
      )}
    >
      {message}
    </div>
  );
}
