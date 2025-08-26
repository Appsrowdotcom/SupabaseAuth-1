import { useEffect, useMemo, useState } from "react";
import { supabase, type Task, type User } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

// Task update schema for editing
const taskUpdateSchema = z.object({
  name: z.string().min(1, "Task name is required").max(150),
  type: z.string().max(50).optional(),
  status: z.enum(["To Do", "In Progress", "On Hold", "Review", "Completed"]),
  assigned_user_id: z.string().uuid().optional().nullable(),
  estimate_hours: z.number().positive().max(999.99).optional().nullable(),
});

type TaskUpdateData = z.infer<typeof taskUpdateSchema>;

const TASK_TYPES = ["Design", "Development", "SEO", "Content", "QA", "Research", "Documentation", "Operations"];
const TASK_STATUSES = ["To Do", "In Progress", "On Hold", "Review", "Completed"] as const;

interface TaskListProps {
  projectId: string;
  // Changing this key triggers refetch to keep UI reactive after external actions (like task creation)
  refreshKey?: number;
}

export function TaskList({ projectId, refreshKey = 0 }: TaskListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Local state for tasks and users (to map assigned_user_id -> name)
  const [tasks, setTasks] = useState<(Task & { assigned_user_name?: string | null })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state for modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete confirmation state
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // React Hook Form for editing with zod validation
  const editForm = useForm<TaskUpdateData>({ resolver: zodResolver(taskUpdateSchema) });

  // Preload users so we can show names in the table and in selects
  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, rank, specialization, created_at")
        .order("name", { ascending: true });
      if (!error && data) setUsers(data as unknown as User[]);
    };
    loadUsers();
  }, []);

  // Build a lookup map for user names by id for fast rendering
  const usersById = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  // Fetch tasks linked to this project_id from Supabase
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // CRUD: read tasks with project linkage via project_id
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      // Enrich each task with assigned user name for nicer UI
      const enriched = (data as Task[]).map(t => ({
        ...t,
        assigned_user_name: t.assigned_user_id ? usersById.get(t.assigned_user_id)?.name ?? null : null,
      }));
      setTasks(enriched);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch tasks when project changes, users map resolves, or after external refresh key changes
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, usersById, refreshKey]);

  // Open edit dialog and prefill with selected task values
  const openEdit = (task: Task) => {
    setEditingTask(task);
    editForm.reset({
      name: task.name,
      type: task.type || "",
      status: task.status as any,
      assigned_user_id: task.assigned_user_id || null,
      estimate_hours: task.estimate_hours ?? null,
    });
    setIsEditDialogOpen(true);
  };

  // Persist edits to Supabase and refresh list
  const submitEdit = async (values: TaskUpdateData) => {
    // Role guard: only Admin can edit
    if (!user || user.role !== "Admin") {
      toast({ title: "Not allowed", description: "Only Admins can edit tasks.", variant: "destructive" });
      return;
    }
    if (!editingTask) return;

    try {
      // CRUD: update task by id
      const { error } = await supabase
        .from("tasks")
        .update({
          name: values.name.trim(),
          type: values.type || null,
          status: values.status,
          assigned_user_id: values.assigned_user_id || null,
          estimate_hours: values.estimate_hours ?? null,
        })
        .eq("id", editingTask.id);
      if (error) throw new Error(error.message);

      toast({ title: "Task updated", description: "Changes saved successfully." });
      setIsEditDialogOpen(false);
      setEditingTask(null);
      fetchTasks(); // refresh list to reflect immediately
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to update task.", variant: "destructive" });
    }
  };

  // Confirm and delete a task (critical change) with dialog
  const confirmDelete = async () => {
    // Role guard: only Admin can delete
    if (!user || user.role !== "Admin") {
      toast({ title: "Not allowed", description: "Only Admins can delete tasks.", variant: "destructive" });
      return;
    }
    if (!deletingTask) return;

    try {
      // CRUD: delete task by id
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", deletingTask.id);
      if (error) throw new Error(error.message);

      toast({ title: "Task deleted", description: `Task "${deletingTask.name}" has been removed.` });
      setIsDeleteDialogOpen(false);
      setDeletingTask(null);
      fetchTasks(); // refresh list
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to delete task.", variant: "destructive" });
    }
  };

  // Admin-only controls flag
  const isAdmin = !!user && user.role === "Admin";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>All tasks for this project</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Error and loading state UI feedback */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse h-10 bg-slate-200 rounded" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-slate-600">No tasks yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-600">
                  <th className="py-2 pr-4">Task</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Assigned</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Est. Hours</th>
                  {isAdmin && <th className="py-2 pr-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 pr-4 font-medium text-slate-900">{t.name}</td>
                    <td className="py-2 pr-4">{t.type || "—"}</td>
                    <td className="py-2 pr-4">{t.assigned_user_name || "Unassigned"}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={t.status === "Completed" ? "default" : t.status === "In Progress" ? "outline" : "secondary"}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">{t.estimate_hours ?? "—"}</td>
                    {isAdmin && (
                      <td className="py-2 pr-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={isDeleteDialogOpen && deletingTask?.id === t.id} onOpenChange={(open) => { if (!open) { setIsDeleteDialogOpen(false); setDeletingTask(null);} }}>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => { setDeletingTask(t); setIsDeleteDialogOpen(true); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{t.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Edit Task Dialog with form state and Supabase update on submit */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details and assignment</DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(submitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select task type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="assigned_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign User</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="estimate_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        className="h-10"
                        value={field.value === undefined || field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
