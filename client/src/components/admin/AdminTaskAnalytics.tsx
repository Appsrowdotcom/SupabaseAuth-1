import { useEffect, useMemo, useState } from "react";
import { supabase, type Task } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

export function AdminTaskAnalytics() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [trend, setTrend] = useState<Array<{ date: string; completed: number }>>([]);

  const fetchData = async () => {
    if (!user || user.role !== 'Admin') return;
    try {
      setIsLoading(true);
      setError(null);
      // All tasks across admin's projects
      const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('id, status, project_id');
      if (tErr) throw new Error(tErr.message);
      const counts: Record<string, number> = {};
      for (const t of (tasks as Task[]) || []) {
        counts[t.status] = (counts[t.status] || 0) + 1;
      }
      setStatusCounts(counts);

      // Trend: completed tasks per day for last 30 days (approximate using created_at if no status history table)
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data: completedTasks, error: cErr } = await supabase
        .from('tasks')
        .select('id, created_at')
        .eq('status', 'Completed')
        .gte('created_at', since.toISOString());
      if (cErr) throw new Error(cErr.message);
      const bucket: Record<string, number> = {};
      for (const t of (completedTasks as any[]) || []) {
        const d = new Date(t.created_at); const key = d.toISOString().slice(0,10);
        bucket[key] = (bucket[key] || 0) + 1;
      }
      const series = Object.entries(bucket).sort(([a],[b]) => a.localeCompare(b)).map(([date, completed]) => ({ date, completed }));
      setTrend(series);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  if (!user || user.role !== 'Admin') return null;

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Status Analytics</CardTitle>
        <CardDescription>Counts and trends of task statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-10 rounded bg-slate-200 animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer config={{ value: { label: 'Tasks', color: 'hsl(280 70% 50%)' }}}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Bar dataKey="value" fill="var(--color-value)" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>

            <ChartContainer config={{ completed: { label: 'Completed', color: 'hsl(140 70% 40%)' }}}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


