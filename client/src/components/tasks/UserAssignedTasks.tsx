import { useEffect, useMemo, useState } from "react";
import { supabase, type Task, type Project } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Play, Pause, Square } from "lucide-react";
import { TaskTimer } from "./UserTaskTimer";

type TaskWithProject = Task & { project?: Project | null; totalLoggedSeconds?: number };

const STATUS_FILTERS = ["All", "To Do", "In Progress", "On Hold", "Review", "Completed"] as const;

interface UserAssignedTasksProps {
  onTimerChanged?: (active: boolean) => void;
}

export function UserAssignedTasks({ onTimerChanged }: UserAssignedTasksProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's assigned tasks with project context and total time logged per task
  const fetchTasks = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(null);
      // Get tasks where current user is assigned
      const { data: tData, error: tErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_user_id", user.id)
        .order("created_at", { ascending: false });
      if (tErr) throw new Error(tErr.message);

      const tasksList = (tData as Task[]) || [];
      const projectIds = Array.from(new Set(tasksList.map(t => t.project_id))).filter(Boolean) as string[];

      // Fetch projects for display of project name
      let projectsById = new Map<string, Project>();
      if (projectIds.length) {
        const { data: pData, error: pErr } = await supabase
          .from("projects")
          .select("*")
          .in("id", projectIds);
        if (pErr) throw new Error(pErr.message);
        projectsById = new Map((pData as Project[]).map(p => [p.id, p]));
      }

      // Aggregate total logged seconds per task from work_logs
      const taskIds = tasksList.map(t => t.id);
      let totals = new Map<string, number>();
      if (taskIds.length) {
        const { data: wData, error: wErr } = await supabase
          .from("work_logs")
          .select("task_id, start_time, end_time")
          .in("task_id", taskIds);
        if (wErr) throw new Error(wErr.message);
        for (const w of (wData as any[]) || []) {
          const start = new Date(w.start_time).getTime();
          const end = new Date(w.end_time).getTime();
          const dur = Math.max(0, Math.floor((end - start) / 1000));
          totals.set(w.task_id, (totals.get(w.task_id) || 0) + dur);
        }
      }

      const enriched = tasksList.map(t => ({
        ...t,
        project: projectsById.get(t.project_id) || null,
        totalLoggedSeconds: totals.get(t.id) || 0,
      }));
      setTasks(enriched);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // Real-time updates on tasks assigned to the user
    if (!user) return;
    const channel = supabase
      .channel(`user-tasks-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `assigned_user_id=eq.${user.id}` }, () => fetchTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_logs' }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (statusFilter === "All") return tasks;
    return tasks.filter(t => t.status === statusFilter);
  }, [tasks, statusFilter]);

  const formatHMS = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!user || user.role !== "User") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">Only regular Users can access assigned tasks.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>Tasks assigned to you across all projects</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-slate-600">Filter by status:</span>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchTasks}>Refresh</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse h-10 bg-slate-200 rounded" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-600">No tasks match this filter.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <div key={t.id} className="p-4 border rounded-md bg-white flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-600">
                    <span className="mr-2">Project: {t.project?.name || '—'}</span>
                    <span className="mr-2">Type: {t.type || '—'}</span>
                    <span className="mr-2">Status: <Badge variant={t.status === 'Completed' ? 'default' : 'outline'}>{t.status}</Badge></span>
                    <span>Est: {t.estimate_hours ?? '—'} h</span>
                  </div>
                  <div className="text-xs text-slate-500">Logged: {formatHMS(t.totalLoggedSeconds || 0)}</div>
                </div>
                <TaskTimer task={t} onChanged={onTimerChanged} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


