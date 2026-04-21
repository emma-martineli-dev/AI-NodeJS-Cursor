'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchRuns } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-400',
  running: 'bg-blue-400',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

export function RunHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
    refetchInterval: 10_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Runs</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
        )}
        {data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Type</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                  <th className="pb-2 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.map((run) => (
                  <tr key={run.id} className="border-b last:border-0">
                    <td className="py-2 font-mono">{run.type}</td>
                    <td className="py-2">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[run.status] ?? 'bg-gray-400'}`} />
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()}
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
