import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface WorkLogItem {
  id: string;
  project_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  note?: string | null;
}

export function UserWorkLogHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const fetchLogs = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(null);
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('work_logs')
        .select('id, project_id, task_id, start_time, end_time, note')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .range(from, to);
      if (error) throw new Error(error.message);
      setLogs((data as WorkLogItem[]) || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load work logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, user?.id]);

  const formatDuration = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const sec = Math.max(0, Math.floor((e - s) / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (!user || user.role !== 'User') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Work Logs</CardTitle>
        <CardDescription>Your recorded work sessions</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-slate-600">No logs yet.</div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {logs.map(l => (
              <div key={l.id} className="p-3 border rounded-md bg-white">
                <div className="text-sm text-slate-900">
                  {new Date(l.start_time).toLocaleString()} → {new Date(l.end_time).toLocaleString()} ({formatDuration(l.start_time, l.end_time)})
                </div>
                {l.note && <div className="text-xs text-slate-600 mt-1">{l.note}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={logs.length < pageSize}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}


