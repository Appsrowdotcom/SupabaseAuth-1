import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "./ProjectCard";
import { Loader2, FolderOpen, Filter, Plus, ArrowRight } from "lucide-react";
import { Project, ProjectStatus } from "@shared/schema";

interface ProjectListProps {
  showCreateButton?: boolean;
}

export function ProjectList({ showCreateButton = false }: ProjectListProps) {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
  });

  const projects: Project[] = data?.projects || [];

  const filteredProjects = projects.filter(project => 
    statusFilter === "all" || project.status === statusFilter
  );

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="projects-loading">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" data-testid="projects-error">
        <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Failed to load projects</h3>
        <p className="text-slate-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800" data-testid="projects-title">
            Projects
          </h2>
          <p className="text-slate-600 mt-1">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {showCreateButton && (
            <Button 
              onClick={() => setLocation("/projects/new")}
              className="bg-primary hover:bg-blue-600"
              data-testid="button-create-project"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProjectStatus | "all")}>
            <SelectTrigger className="w-40" data-testid="filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="text-center py-12" data-testid="empty-projects">
            <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {statusFilter === "all" ? "No projects yet" : `No ${statusFilter.toLowerCase()} projects`}
            </h3>
            <p className="text-slate-600">
              {statusFilter === "all" 
                ? "Get started by creating your first project." 
                : "Try changing the filter to see more projects."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Status Summary */}
      {projects.length > 0 && (
        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Project Status Summary</h3>
            <div className="flex flex-wrap gap-3">
              {["In Progress", "On Hold", "Completed"].map((status) => {
                const count = projects.filter(p => p.status === status).length;
                return (
                  <Badge 
                    key={status} 
                    className={`${getStatusColor(status as ProjectStatus)} border-0`}
                    data-testid={`status-count-${status.toLowerCase().replace(' ', '-')}`}
                  >
                    {status}: {count}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}