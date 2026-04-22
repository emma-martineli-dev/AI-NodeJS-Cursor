'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchRuns, ScenarioRun } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDuration, statusToVariant } from '@/lib/utils';

export function RunHistory() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
    refetchInterval: 5_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {isError  && <p className="text-sm text-destructive">Failed to load runs.</p>}
        {data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
        )}
        {data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  {['Type', 'Status', 'Duration', 'Time'].map((h) => (
                    <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((run: ScenarioRun) => (
                  <tr key={run.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono">{run.type}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={statusToVariant(run.status)}>{run.status}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDuration(run.duration)}</td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(run.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
