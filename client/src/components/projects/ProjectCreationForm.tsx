import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar, FolderPlus } from "lucide-react";

const formSchema = insertProjectSchema.extend({
  name: z.string().min(1, "Project name is required").min(3, "Project name must be at least 3 characters"),
  type: z.string().min(1, "Project type is required"),
  deadline: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const PROJECT_TYPES = [
  "webflow",
  "logo design", 
  "web development",
  "mobile app",
  "ui/ux design",
  "marketing campaign",
  "content creation",
  "seo optimization",
  "branding",
  "other"
];

export function ProjectCreationForm() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Authorization check
  if (!user || user.role !== "PM") {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <FolderPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Not Authorized</h2>
              <p>Only Project Managers can create new projects.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      deadline: "",
      pmId: user.id,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const projectData = {
        ...data,
        pmId: user.id,
        deadline: data.deadline || null,
      };
      
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create project");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });
      setLocation("/projects");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createProjectMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center space-x-3 mb-2">
          <FolderPlus className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-slate-800" data-testid="page-title">
            Create New Project
          </h1>
        </div>
        <p className="text-slate-600">
          Fill in the details below to create a new project for your team.
        </p>
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Project Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter project name (e.g., E-commerce Website Redesign)"
                        data-testid="input-project-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-type">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="date"
                          data-testid="input-deadline"
                          {...field}
                        />
                        <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  disabled={createProjectMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  data-testid="button-create-project"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}