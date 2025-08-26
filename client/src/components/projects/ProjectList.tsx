import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase, type Project } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FolderOpen, 
  Edit, 
  Archive, 
  Eye, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  Calendar,
  Clock
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Project update schema for inline editing
const projectUpdateSchema = z.object({
  name: z.string().min(1, "Project name is required").max(150, "Project name must be less than 150 characters"),
  type: z.string().min(1, "Project type is required"),
  status: z.enum(["In Progress", "On Hold", "Completed", "Archived"]),
  deadline: z.string().optional(),
});

type ProjectUpdateData = z.infer<typeof projectUpdateSchema>;

// Available project types and statuses
const PROJECT_TYPES = [
  "Logo Design", "Webflow Website", "SEO", "Branding", "Web Development",
  "Mobile App", "Content Creation", "Social Media", "Print Design", "Video Production"
];

const PROJECT_STATUSES = ["In Progress", "On Hold", "Completed", "Archived"];

interface ProjectListProps {
  onProjectUpdated?: () => void; // Callback to refresh data
  onCreateNewProject?: () => void; // Callback to show creation form
}

export function ProjectList({ onProjectUpdated, onCreateNewProject }: ProjectListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);

  // Form for editing projects
  const editForm = useForm<ProjectUpdateData>({
    resolver: zodResolver(projectUpdateSchema),
  });

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    if (!user || user.role !== "Admin") return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch projects where the current user is the admin
      const { data: fetchedProjects, error: fetchError } = await supabase
        .from("projects")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError);
        throw new Error(fetchError.message || "Failed to fetch projects");
      }

      setProjects(fetchedProjects || []);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      setError(error.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  // Load projects on component mount and when user changes
  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Handle project editing
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    editForm.reset({
      name: project.name,
      type: project.type,
      status: project.status,
      deadline: project.deadline || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle project update submission
  const handleUpdateProject = async (data: ProjectUpdateData) => {
    if (!editingProject || !user || user.role !== "Admin") return;

    try {
      // Update project in Supabase
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          name: data.name.trim(),
          type: data.type,
          status: data.status,
          deadline: data.deadline || null,
        })
        .eq("id", editingProject.id)
        .eq("admin_id", user.id); // Ensure user can only update their own projects

      if (updateError) {
        console.error("Supabase update error:", updateError);
        throw new Error(updateError.message || "Failed to update project");
      }

      // Show success message
      toast({
        title: "Project Updated!",
        description: `"${data.name}" has been successfully updated.`,
      });

      // Close dialog and refresh data
      setIsEditDialogOpen(false);
      setEditingProject(null);
      fetchProjects();
      
      // Call callback if provided
      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update project.",
        variant: "destructive",
      });
    }
  };

  // Handle project archiving
  const handleArchiveProject = async () => {
    if (!projectToArchive || !user || user.role !== "Admin") return;

    try {
      // Update project status to Archived
      const { error: updateError } = await supabase
        .from("projects")
        .update({ status: "Archived" })
        .eq("id", projectToArchive.id)
        .eq("admin_id", user.id);

      if (updateError) {
        console.error("Supabase archive error:", updateError);
        throw new Error(updateError.message || "Failed to archive project");
      }

      // Show success message
      toast({
        title: "Project Archived!",
        description: `"${projectToArchive.name}" has been archived.`,
      });

      // Close dialog and refresh data
      setIsArchiveDialogOpen(false);
      setProjectToArchive(null);
      fetchProjects();
      
      // Call callback if provided
      if (onProjectUpdated) {
        onProjectUpdated();
      }
    } catch (error: any) {
      console.error("Error archiving project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to archive project.",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "In Progress": return "outline";
      case "On Hold": return "secondary";
      case "Archived": return "destructive";
      default: return "outline";
    }
  };

  // Check if deadline is approaching or overdue
  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "approaching";
    return "normal";
  };

  // Authorization check
  if (!user || user.role !== "Admin") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Not Authorized</h3>
            <p className="text-red-700">Only Admin users can manage projects.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Projects</h2>
          <p className="text-slate-600">Manage and track all your active projects</p>
        </div>
        <Button onClick={onCreateNewProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Projects List */}
      {!isLoading && projects.length === 0 && (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="pt-12 pb-12 text-center">
            <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Projects Yet</h3>
            <p className="text-slate-600 mb-4">Get started by creating your first project.</p>
            <Button onClick={onCreateNewProject} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && projects.length > 0 && (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Project Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {project.name}
                      </h3>
                      <Badge variant="outline">{project.type}</Badge>
                      <Badge variant={getStatusVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      {project.deadline && (
                        <div className={`flex items-center gap-1 ${
                          getDeadlineStatus(project.deadline) === "overdue" ? "text-red-600" :
                          getDeadlineStatus(project.deadline) === "approaching" ? "text-orange-600" : ""
                        }`}>
                          <Clock className="h-4 w-4" />
                          <span>Deadline: {formatDate(project.deadline)}</span>
                          {getDeadlineStatus(project.deadline) === "overdue" && (
                            <Badge variant="destructive" className="ml-2">Overdue</Badge>
                          )}
                          {getDeadlineStatus(project.deadline) === "approaching" && (
                            <Badge variant="secondary" className="ml-2">Due Soon</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    
                                         {project.status !== "Archived" && project.status !== "Completed" && (
                      <AlertDialog open={isArchiveDialogOpen && projectToArchive?.id === project.id} onOpenChange={(open) => {
                        if (!open) {
                          setIsArchiveDialogOpen(false);
                          setProjectToArchive(null);
                        }
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProjectToArchive(project);
                              setIsArchiveDialogOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive Project</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to archive "{project.name}"? This action can be undone later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleArchiveProject}>
                              Archive Project
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the details for "{editingProject?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateProject)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
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
                    <FormLabel>Project Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="h-10"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}