import { z } from "zod";

// User schemas
export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address").max(150, "Email must be less than 150 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "User"], { required_error: "Role is required" }),
  rank: z.string().max(50, "Rank must be less than 50 characters").optional(),
  specialization: z.string().max(50, "Specialization must be less than 50 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Project schemas
export const insertProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(150, "Project name must be less than 150 characters"),
  type: z.string().min(1, "Project type is required").max(50, "Project type must be less than 50 characters"),
  status: z.enum(["In Progress", "On Hold", "Completed", "Archived"]).default("In Progress"),
  admin_id: z.string().uuid("Invalid admin ID"),
  deadline: z.string().optional(),
});

// Task schemas
export const insertTaskSchema = z.object({
  project_id: z.string().uuid("Invalid project ID"),
  name: z.string().min(1, "Task name is required").max(150, "Task name must be less than 150 characters"),
  type: z.string().max(50, "Task type must be less than 50 characters").optional(),
  status: z.enum(["To Do", "In Progress", "On Hold", "Review", "Completed"]).default("To Do"),
  assigned_user_id: z.string().uuid("Invalid user ID").optional(),
  estimate_hours: z.number().positive("Estimate must be positive").max(999.99, "Estimate must be less than 1000 hours").optional(),
});

// Work log schemas
export const insertWorkLogSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  project_id: z.string().uuid("Invalid project ID"),
  task_id: z.string().uuid("Invalid task ID").optional(),
  start_time: z.string().datetime("Invalid start time"),
  end_time: z.string().datetime("Invalid end time"),
  note: z.string().optional(),
});

// Status history schemas
export const insertStatusHistorySchema = z.object({
  entity_type: z.enum(["project", "task"], { required_error: "Entity type is required" }),
  entity_id: z.string().uuid("Invalid entity ID"),
  status: z.string().min(1, "Status is required").max(20, "Status must be less than 20 characters"),
  updated_by: z.string().uuid("Invalid user ID"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserRole = "Admin" | "User";

// User type (matches the database schema exactly)
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rank?: string;
  specialization?: string;
  created_at: string;
}

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectStatus = "In Progress" | "On Hold" | "Completed" | "Archived";

// Project type (matches the database schema exactly)
export interface Project {
  id: string;
  name: string;
  type: string;
  status: ProjectStatus;
  admin_id: string;
  created_at: string;
  deadline?: string;
}

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskStatus = "To Do" | "In Progress" | "On Hold" | "Review" | "Completed";

// Task type (matches the database schema exactly)
export interface Task {
  id: string;
  project_id: string;
  name: string;
  type: string;
  status: TaskStatus;
  assigned_user_id?: string;
  estimate_hours?: number;
  created_at: string;
}

export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type InsertStatusHistory = z.infer<typeof insertStatusHistorySchema>;
