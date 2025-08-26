import { useEffect, useMemo, useState } from "react";
import { supabase, type Project, type Task } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";

type ProjectRow = Project & {
  totalHours: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksOnHold: number;
};

const STATUS_FILTERS: Array<Project["status"] | "All"> = ["All", "In Progress", "On Hold", "Completed", "Archived"];

export function AdminProjectOverview() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aggregates per project: total hours from work_logs and task status counts
  const fetchData = async () => {
    if (!user || user.role !== "Admin") return;
    try {
      setIsLoading(true);
      setError(null);
      // Load projects for this admin
      const { data: projects, error: pErr } = await supabase
        .from("projects")
        .select("*")
        .eq("admin_id", user.id);
      if (pErr) throw new Error(pErr.message);
      const projectList = (projects as Project[]) || [];
      const projectIds = projectList.map(p => p.id);

      // Load tasks to count per status by project
      const { data: tasks, error: tErr } = await supabase
        .from("tasks")
        .select("id, project_id, status")
        .in("project_id", projectIds);
      if (tErr) throw new Error(tErr.message);
      const tasksByProject = new Map<string, Task[]>();
      for (const t of (tasks as Task[]) || []) {
        const arr = tasksByProject.get(t.project_id) || [];
        arr.push(t);
        tasksByProject.set(t.project_id, arr);
      }

      // Load work_logs to compute total hours per project
      const { data: logs, error: wErr } = await supabase
        .from("work_logs")
        .select("project_id, start_time, end_time")
        .in("project_id", projectIds);
      if (wErr) throw new Error(wErr.message);
      const secondsByProject = new Map<string, number>();
      for (const w of (logs as any[]) || []) {
        const s = new Date(w.start_time).getTime();
        const e = new Date(w.end_time).getTime();
        const sec = Math.max(0, Math.floor((e - s) / 1000));
        secondsByProject.set(w.project_id, (secondsByProject.get(w.project_id) || 0) + sec);
      }

      const result: ProjectRow[] = projectList.map(p => {
        const ptasks = tasksByProject.get(p.id) || [];
        const totals = {
          total: ptasks.length,
          completed: ptasks.filter(t => t.status === "Completed").length,
          inprogress: ptasks.filter(t => t.status === "In Progress").length,
          onhold: ptasks.filter(t => t.status === "On Hold").length,
        };
        return {
          ...p,
          totalHours: (secondsByProject.get(p.id) || 0) / 3600,
          tasksTotal: totals.total,
          tasksCompleted: totals.completed,
          tasksInProgress: totals.inprogress,
          tasksOnHold: totals.onhold,
        };
      });
      setRows(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load overview");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const statusOk = statusFilter === "All" || r.status === statusFilter;
      const searchOk = !search || r.name.toLowerCase().includes(search.toLowerCase());
      return statusOk && searchOk;
    });
  }, [rows, statusFilter, search]);

  if (!user || user.role !== "Admin") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">Admin access only.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>Hours and task status across your projects</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <Input placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-[220px]" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 rounded bg-slate-200 animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-600">
                  <th className="py-2 pr-4">Project</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Hours</th>
                  <th className="py-2 pr-4">Tasks</th>
                  <th className="py-2 pr-4">Completed</th>
                  <th className="py-2 pr-4">In Progress</th>
                  <th className="py-2 pr-4">On Hold</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-4 font-medium text-slate-900">{r.name}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 pr-4">{r.totalHours.toFixed(2)}</td>
                    <td className="py-2 pr-4">{r.tasksTotal}</td>
                    <td className="py-2 pr-4">{r.tasksCompleted}</td>
                    <td className="py-2 pr-4">{r.tasksInProgress}</td>
                    <td className="py-2 pr-4">{r.tasksOnHold}</td>
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


