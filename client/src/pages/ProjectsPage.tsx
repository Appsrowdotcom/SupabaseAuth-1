import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ProjectCreationForm } from "@/components/projects/ProjectCreationForm";
import { ProjectList } from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen, 
  Plus, 
  ArrowLeft,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger data refresh

  // Authorization check
  if (!user || user.role !== "Admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h3>
              <p className="text-red-700 mb-4">Only Admin users can access project management.</p>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Callback to refresh project list
  const handleProjectCreated = () => {
    setRefreshKey(prev => prev + 1);
    setShowCreateForm(false);
  };

  // Callback to refresh project list after updates
  const handleProjectUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Callback to show project creation form
  const handleCreateNewProject = () => {
    setShowCreateForm(true);
  };

  // Callback to hide project creation form
  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <FolderOpen className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-slate-900">
                Project Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Project Management Dashboard
          </h2>
          <p className="text-slate-600">
            Create, manage, and track all your projects in one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Create your first project to get started
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Hold</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Temporarily paused
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        {showCreateForm ? (
          <div className="space-y-6">
            {/* Create Form Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Create New Project</h3>
                <p className="text-slate-600">Fill in the details below to create your project</p>
              </div>
              <Button
                variant="outline"
                onClick={handleCancelCreate}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
            </div>

            {/* Project Creation Form */}
            <ProjectCreationForm
              onProjectCreated={handleProjectCreated}
              onCancel={handleCancelCreate}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Projects List Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">My Projects</h3>
                <p className="text-slate-600">Manage and track all your active projects</p>
              </div>
              <Button
                onClick={handleCreateNewProject}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>

            {/* Projects List */}
            <ProjectList
              key={refreshKey} // Force re-render when data changes
              onProjectUpdated={handleProjectUpdated}
              onCreateNewProject={handleCreateNewProject}
            />
          </div>
        )}
      </main>
    </div>
  );
}