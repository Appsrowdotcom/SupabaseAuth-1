import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TaskList } from "./TaskList";
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  User,
  Clock,
  AlertCircle,
  ArrowRight,
  Settings
} from "lucide-react";
import { Project, Task } from "@/lib/schemas";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setLocation] = useLocation();

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/projects", project.id, "tasks"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/tasks`, { 
        credentials: "include" 
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
    enabled: isExpanded,
  });

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

  const isOverdue = project.deadline && new Date(project.deadline) < new Date();
  const daysUntilDeadline = project.deadline 
    ? Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="border border-slate-200 hover:shadow-md transition-shadow duration-200">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-6 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <FolderOpen className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <h3 
                    className="text-lg font-semibold text-slate-800 truncate" 
                    data-testid={`project-name-${project.id}`}
                  >
                    {project.name}
                  </h3>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                  <span className="bg-slate-100 px-2 py-1 rounded-md">
                    {project.type}
                  </span>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>

                {project.deadline && (
                  <div className="flex items-center space-x-2 text-sm mb-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span 
                      className={`${
                        isOverdue 
                          ? "text-red-600 font-medium" 
                          : daysUntilDeadline !== null && daysUntilDeadline <= 7
                            ? "text-amber-600 font-medium"
                            : "text-slate-600"
                      }`}
                      data-testid={`project-deadline-${project.id}`}
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

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Created {format(new Date(project.createdAt || new Date()), "MMM d, yyyy")}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/projects/${project.id}/tasks`);
                    }}
                    className="text-primary hover:text-blue-600"
                    data-testid={`manage-tasks-${project.id}`}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage Tasks
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-200 px-6 pb-6">
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-700">Project Tasks</h4>
                {tasks.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {tasks.filter(t => t.status === "Completed").length} of {tasks.length} completed
                  </span>
                )}
              </div>
              
              <TaskList 
                projectId={project.id} 
                tasks={tasks} 
                isLoading={tasksLoading} 
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}