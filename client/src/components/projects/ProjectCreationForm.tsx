import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@/lib/schemas";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Project creation form data type
type ProjectFormData = {
  name: string;
  type: string;
  deadline?: string;
};

// Available project types for the dropdown
const PROJECT_TYPES = [
  "Logo Design",
  "Webflow Website", 
  "SEO",
  "Branding",
  "Web Development",
  "Mobile App",
  "Content Creation",
  "Social Media",
  "Print Design",
  "Video Production"
];

interface ProjectCreationFormProps {
  onProjectCreated?: () => void; // Callback to refresh project list
  onCancel?: () => void; // Callback to close form
}

export function ProjectCreationForm({ onProjectCreated, onCancel }: ProjectCreationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      type: "",
      deadline: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProjectFormData) => {
    // Ensure user is authenticated and is an Admin
    if (!user || user.role !== "Admin") {
      setError("You must be an Admin to create projects.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare project data for Supabase
      const projectData = {
        name: data.name.trim(),
        type: data.type,
        status: "In Progress", // Default status for new projects
        admin_id: user.id, // Associate project with current Admin
        deadline: data.deadline || null, // Handle optional deadline
      };

      // Insert project into Supabase projects table
      const { data: newProject, error: insertError } = await supabase
        .from("projects")
        .insert([projectData])
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(insertError.message || "Failed to create project");
      }

      if (newProject) {
        // Show success state
        setIsSuccess(true);
        setError(null);
        
        // Show success toast
        toast({
          title: "Project Created!",
          description: `"${data.name}" has been successfully created.`,
        });

        // Reset form
        form.reset();
        
        // Call callback to refresh project list
        if (onProjectCreated) {
          onProjectCreated();
        }

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error("Project creation error:", error);
      setError(error.message || "Failed to create project. Please try again.");
      
      // Show error toast
      toast({
        title: "Error",
        description: error.message || "Failed to create project.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message
  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Project Created Successfully!
              </h3>
              <p className="text-green-700 text-sm">
                Your new project has been added to the system.
              </p>
            </div>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={() => setIsSuccess(false)}
                variant="outline"
                size="sm"
              >
                Create Another Project
              </Button>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Project
        </CardTitle>
        <CardDescription>
          Add a new project to your portfolio. Fill in the details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Project Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter project name (e.g., E-commerce Website Redesign)"
                      disabled={isLoading}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Type Field */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
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

            {/* Deadline Field */}
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      disabled={isLoading}
                      className="h-11"
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-slate-500 mt-1">
                    Leave blank if no specific deadline is set
                  </p>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}