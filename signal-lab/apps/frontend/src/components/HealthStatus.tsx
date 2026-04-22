'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/status-dot';

export function HealthStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  const status = isLoading ? 'loading' : isError ? 'offline' : 'online';
  const label = isLoading
    ? 'Checking…'
    : isError
    ? 'Unreachable'
    : `${data!.status} · ${new Date(data!.timestamp).toLocaleTimeString()}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">API Status</CardTitle>
      </CardHeader>
      <CardContent>
        <StatusDot status={status} label={label} />
      </CardContent>
    </Card>
  );
}
