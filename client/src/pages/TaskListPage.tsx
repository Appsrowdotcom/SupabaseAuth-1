import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/projects/TaskList";
import { 
  ArrowLeft, 
  FolderOpen, 
  Calendar, 
  Loader2,
  AlertCircle,
  Clock
} from "lucide-react";
import { Project, Task } from "@shared/schema";
import { format } from "date-fns";

export default function TaskListPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectId = params.id;

  // Authorization check
  if (!user || user.role !== "PM") {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-6">
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Not Authorized</h2>
          <p className="text-slate-600 mb-4">Only Project Managers can access task management.</p>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Fetch project details
  const { data: projectData, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects`, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      const project = data.projects.find((p: Project) => p.id === projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      return { project };
    },
    enabled: !!projectId,
  });

  // Fetch tasks for the project
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["/api/projects", projectId, "tasks"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/tasks`, { 
        credentials: "include" 
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
    enabled: !!projectId,
  });

  const project: Project | undefined = projectData?.project;
  const tasks: Task[] = tasksData?.tasks || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (projectLoading) {
    return (
      <div className="max-w-6xl mx-auto mt-8 px-6">
        <div className="flex items-center justify-center py-12" data-testid="project-loading">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-600">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="max-w-6xl mx-auto mt-8 px-6">
        <div className="text-center py-12" data-testid="project-error">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Project not found</h3>
          <p className="text-slate-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/projects")}
            data-testid="button-back-projects"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const isOverdue = project.deadline && new Date(project.deadline) < new Date();
  const daysUntilDeadline = project.deadline 
    ? Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-6xl mx-auto mt-8 px-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/projects")}
          className="mb-4"
          data-testid="button-back-projects"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              <h1 
                className="text-3xl font-bold text-slate-800" 
                data-testid="project-title"
              >
                {project.name}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 text-sm mb-3">
              <span className="bg-slate-100 px-3 py-1 rounded-md font-medium">
                {project.type}
              </span>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>

            {project.deadline && (
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span 
                  className={`${
                    isOverdue 
                      ? "text-red-600 font-medium" 
                      : daysUntilDeadline !== null && daysUntilDeadline <= 7
                        ? "text-amber-600 font-medium"
                        : "text-slate-600"
                  }`}
                >
                  Due: {format(new Date(project.deadline), "MMM d, yyyy")}
                  {isOverdue && (
                    <span className="ml-2 inline-flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </span>
                  )}
                  {!isOverdue && daysUntilDeadline !== null && daysUntilDeadline <= 7 && (
                    <span className="ml-2 inline-flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {daysUntilDeadline} days left
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Tasks */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Tasks</span>
            {tasks.length > 0 && (
              <span className="text-sm font-normal text-slate-500">
                {tasks.filter(t => t.status === "Completed").length} of {tasks.length} completed
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList 
            projectId={project.id} 
            tasks={tasks} 
            isLoading={tasksLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
}