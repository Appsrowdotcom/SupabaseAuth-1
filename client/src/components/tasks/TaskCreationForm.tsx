import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@/lib/schemas";
import { supabase, type User } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Local type for form inputs
interface TaskFormData {
  name: string;
  type?: string;
  assigned_user_id?: string;
  estimate_hours?: number;
}

// Predefined task types
const TASK_TYPES = [
  "Design",
  "Development",
  "SEO",
  "Content",
  "QA",
  "Research",
  "Documentation",
  "Operations",
];

interface TaskCreationFormProps {
  projectId: string;
  onCreated?: () => void; // Called after successful creation to refresh parent list
}

export function TaskCreationForm({ projectId, onCreated }: TaskCreationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize form with zod validation mapped to our insertTaskSchema
  const form = useForm<TaskFormData>({
    resolver: zodResolver(insertTaskSchema.pick({
      name: true,
      type: true,
      assigned_user_id: true,
      estimate_hours: true,
    }) as any),
    defaultValues: {
      name: "",
      type: "",
      assigned_user_id: undefined,
      estimate_hours: undefined,
    },
  });

  // Fetch users to populate the assignment dropdown
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

  // Map for select items
  const userOptions = useMemo(() => users.map(u => ({ value: u.id, label: `${u.name}` })), [users]);

  // Submit handler: inserts the new task linked to current project
  const onSubmit = async (data: TaskFormData) => {
    if (!user || user.role !== "Admin") {
      setError("Only Admins can create tasks.");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        project_id: projectId,
        name: data.name.trim(),
        type: data.type || null,
        status: "To Do" as const,
        assigned_user_id: data.assigned_user_id || null,
        estimate_hours: data.estimate_hours ?? null,
      };

      const { error: insertError } = await supabase
        .from("tasks")
        .insert([payload]);

      if (insertError) throw new Error(insertError.message || "Failed to create task");

      toast({ title: "Task created", description: `Task "${payload.name}" added to this project.` });
      form.reset();
      onCreated?.();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to create task.");
    } finally {
      setIsLoading(false);
    }
  };

  // Non-admin view guard
  if (!user || user.role !== "Admin") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">Only Admins can create tasks.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Task
        </CardTitle>
        <CardDescription>Create a task and assign it to a team member.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Task Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Implement login UI" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
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

            {/* Assign User */}
            <FormField
              control={form.control}
              name="assigned_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign User</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a user (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimated Hours */}
            <FormField
              control={form.control}
              name="estimate_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      placeholder="e.g., 6"
                      className="h-11"
                      value={field.value === undefined || field.value === null ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="min-w-[140px]">
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>) : "Add Task"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
