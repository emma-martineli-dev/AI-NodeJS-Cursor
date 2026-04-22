import { cn } from '@/lib/utils';

interface StatusDotProps {
  status: 'online' | 'offline' | 'loading';
  label: string;
}

const DOT_COLOR = {
  online:  'bg-green-500',
  offline: 'bg-red-500',
  loading: 'bg-yellow-400',
};

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2 w-2 rounded-full', DOT_COLOR[status])} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
