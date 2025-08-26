import { useEffect, useMemo, useState } from "react";
import { supabase, type User, type Project, type Task } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

type Timeframe = 'day' | 'week' | 'month';

interface UserSummaryRow {
  user: User;
  totalHours: number;
  byProject: Record<string, number>;
  byType: Record<string, number>;
  overdueTasks: number;
}

export function AdminTeamProductivity() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [rows, setRows] = useState<UserSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    if (!user || user.role !== 'Admin') return;
    try {
      setIsLoading(true);
      setError(null);
      // Time window
      const now = new Date();
      const start = new Date(now);
      if (timeframe === 'day') start.setDate(now.getDate() - 1);
      if (timeframe === 'week') start.setDate(now.getDate() - 7);
      if (timeframe === 'month') start.setMonth(now.getMonth() - 1);

      // Load team users (all users for now)
      const { data: usersData, error: uErr } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });
      if (uErr) throw new Error(uErr.message);
      const team = (usersData as User[]) || [];

      const userIds = team.map(u => u.id);

      // Load logs in time window
      const { data: logs, error: lErr } = await supabase
        .from('work_logs')
        .select('user_id, project_id, task_id, start_time, end_time')
        .gte('start_time', start.toISOString())
        .lte('end_time', now.toISOString())
        .in('user_id', userIds);
      if (lErr) throw new Error(lErr.message);

      // Load tasks to derive types and overdue
      const taskIds = Array.from(new Set(((logs as any[]) || []).map(l => l.task_id).filter(Boolean)));
      const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('id, project_id, type, status, created_at')
        .in('id', taskIds.length ? taskIds : ['00000000-0000-0000-0000-000000000000']);
      if (tErr) throw new Error(tErr.message);
      const tasksById = new Map<string, Task>((tasks as Task[]).map(t => [t.id, t]));

      // Aggregate per user
      const byUser: Record<string, UserSummaryRow> = {};
      for (const u of team) {
        byUser[u.id] = { user: u, totalHours: 0, byProject: {}, byType: {}, overdueTasks: 0 };
      }
      for (const l of (logs as any[]) || []) {
        const durSec = Math.max(0, Math.floor((new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 1000));
        const row = byUser[l.user_id];
        if (!row) continue;
        row.totalHours += durSec / 3600;
        row.byProject[l.project_id] = (row.byProject[l.project_id] || 0) + durSec / 3600;
        const t = tasksById.get(l.task_id);
        const type = t?.type || 'Other';
        row.byType[type] = (row.byType[type] || 0) + durSec / 3600;
      }

      // Overdue tasks: simple heuristic - tasks not Completed created over 30 days ago
      for (const t of tasksById.values()) {
        const created = new Date(t.created_at);
        const over30 = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) > 30;
        if (over30 && t.status !== 'Completed' && t.assigned_user_id) {
          byUser[t.assigned_user_id].overdueTasks += 1;
        }
      }

      setRows(Object.values(byUser));
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load team productivity');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id, timeframe]);

  const filtered = useMemo(() => {
    return rows.filter(r => !search || r.user.name.toLowerCase().includes(search.toLowerCase()));
  }, [rows, search]);

  if (!user || user.role !== 'Admin') return null;

  // Prepare chart data
  const totalHoursChart = filtered.map(r => ({ name: r.user.name, hours: Number(r.totalHours.toFixed(2)) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Productivity</CardTitle>
        <CardDescription>Hours by user and contribution breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="Search team" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-[220px]" />
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
            <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Timeframe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last day</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-10 rounded bg-slate-200 animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer config={{ hours: { label: 'Hours', color: 'hsl(220 70% 50%)' }}}>
              <BarChart data={totalHoursChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide={false} />
                <YAxis />
                <Bar dataKey="hours" fill="var(--color-hours)" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-600">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Hours</th>
                    <th className="py-2 pr-4">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.user.id} className="border-b">
                      <td className="py-2 pr-4 font-medium text-slate-900">{r.user.name}</td>
                      <td className="py-2 pr-4">{r.totalHours.toFixed(2)}</td>
                      <td className="py-2 pr-4">{r.overdueTasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


