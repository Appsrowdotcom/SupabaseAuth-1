import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabase, type Project } from "@/lib/supabase";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskCreationForm } from "@/components/tasks/TaskCreationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft, FolderOpen } from "lucide-react";

export default function TaskListPage() {
  const [, params] = useRoute("/projects/:id/tasks");
  const projectId = params?.id || "";
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // triggers task list reloads

  // Load project details from Supabase for header context
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();
        if (error) throw new Error(error.message);
        setProject(data as Project);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) loadProject();
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Invalid project URL.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Guard: Admin-only access to tasks view and management
  if (!user || user.role !== "Admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Not Authorized</h3>
              <p className="text-red-700 mb-4">Only Admin users can manage tasks.</p>
              <Button variant="outline" onClick={() => setLocation("/")}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Callback after successful task creation: increment key to re-fetch tasks
  const handleTaskCreated = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setLocation("/projects")} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <FolderOpen className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold text-slate-900">Project Tasks</h1>
            </div>
            {project && (
              <Badge variant="outline">{project.name}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-slate-600">Loading project...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Admin-only task creation form; calls back to refresh list */}
            <TaskCreationForm projectId={projectId} onCreated={handleTaskCreated} />

            {/* Task list receives refreshKey to re-query Supabase when it changes */}
            <TaskList projectId={projectId} refreshKey={refreshKey} />
          </>
        )}
      </main>
    </div>
  );
}