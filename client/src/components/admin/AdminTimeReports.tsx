import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";

interface LogRow {
  user_id: string;
  project_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  note?: string | null;
}

export function AdminTimeReports() {
  const { user } = useAuth();
  const [from, setFrom] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user || user.role !== 'Admin') return;
    try {
      setIsLoading(true);
      setError(null);
      const fromIso = new Date(from).toISOString();
      const toIso = new Date(new Date(to).setHours(23,59,59,999)).toISOString();
      const { data, error } = await supabase
        .from('work_logs')
        .select('user_id, project_id, task_id, start_time, end_time, note')
        .gte('start_time', fromIso)
        .lte('end_time', toIso)
        .order('start_time', { ascending: false });
      if (error) throw new Error(error.message);
      setRows((data as LogRow[]) || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load time reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const exportCsv = () => {
    const header = ['user_id', 'project_id', 'task_id', 'start_time', 'end_time', 'note'];
    const lines = [header.join(',')].concat(rows.map(r => [r.user_id, r.project_id, r.task_id, r.start_time, r.end_time, (r.note || '').replace(/\n|\r|,/g, ' ')].join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `time-report_${from}_to_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!user || user.role !== 'Admin') return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking Reports</CardTitle>
        <CardDescription>Generate detailed logs and export CSV</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <div className="text-xs text-slate-600 mb-1">From</div>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">To</div>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
          <Button className="h-9" onClick={fetchData} disabled={isLoading}>{isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading</>) : 'Run Report'}</Button>
          <Button className="h-9" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>Export CSV</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-600">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Project</th>
                <th className="py-2 pr-4">Task</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">End</th>
                <th className="py-2 pr-4">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 pr-4">{r.user_id}</td>
                  <td className="py-2 pr-4">{r.project_id}</td>
                  <td className="py-2 pr-4">{r.task_id}</td>
                  <td className="py-2 pr-4">{new Date(r.start_time).toLocaleString()}</td>
                  <td className="py-2 pr-4">{new Date(r.end_time).toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


