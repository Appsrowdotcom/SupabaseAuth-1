import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/projects/ProjectList";
import { useLocation } from "wouter";
import { Plus, FolderOpen, ArrowLeft } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Authorization check
  if (!user || user.role !== "PM") {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-6">
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Not Authorized</h2>
          <p className="text-slate-600 mb-4">Only Project Managers can access the projects page.</p>
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

  return (
    <div className="max-w-6xl mx-auto mt-8 px-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800" data-testid="page-title">
              My Projects
            </h1>
            <p className="text-slate-600 mt-2">
              Manage and track all your projects in one place.
            </p>
          </div>
          
          <Button 
            onClick={() => setLocation("/projects/new")}
            className="bg-primary hover:bg-blue-600"
            data-testid="button-new-project"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <ProjectList />
    </div>
  );
}