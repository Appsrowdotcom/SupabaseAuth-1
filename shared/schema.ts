import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum, uuid, date, numeric, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["PM", "Team"]);
export const projectStatusEnum = pgEnum("project_status", ["In Progress", "On Hold", "Completed"]);
export const taskStatusEnum = pgEnum("task_status", ["To Do", "In Progress", "On Hold", "Review", "Completed"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  rank: text("rank"),
  specialization: text("specialization"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., logo design, SEO, webflow
  status: projectStatusEnum("status").notNull().default("In Progress"),
  pmId: uuid("pm_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  deadline: date("deadline"),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., design, development, SEO
  status: taskStatusEnum("status").notNull().default("To Do"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  estimateHours: numeric("estimate_hours"),
  createdAt: timestamp("created_at").defaultNow(),
});

// WorkLogs table
export const workLogs = pgTable("work_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  taskId: uuid("task_id").references(() => tasks.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  endTimeCheck: check("end_time_check", sql`${table.endTime} > ${table.startTime}`)
}));

// StatusHistory table
export const statusHistory = pgTable("status_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectOrTaskId: uuid("project_or_task_id").notNull(), // References either projects.id or tasks.id
  status: text("status").notNull(),
  updatedBy: uuid("updated_by").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  role: true,
  rank: true,
  specialization: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  type: true,
  status: true,
  pmId: true,
  deadline: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  projectId: true,
  name: true,
  type: true,
  status: true,
  assignedTo: true,
  estimateHours: true,
});

export const insertWorkLogSchema = createInsertSchema(workLogs).pick({
  userId: true,
  projectId: true,
  taskId: true,
  startTime: true,
  endTime: true,
  notes: true,
});

export const insertStatusHistorySchema = createInsertSchema(statusHistory).pick({
  projectOrTaskId: true,
  status: true,
  updatedBy: true,
});

// Auth schemas
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserRole = "PM" | "Team";

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type ProjectStatus = "In Progress" | "On Hold" | "Completed";

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskStatus = "To Do" | "In Progress" | "On Hold" | "Review" | "Completed";

export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type WorkLog = typeof workLogs.$inferSelect;

export type InsertStatusHistory = z.infer<typeof insertStatusHistorySchema>;
export type StatusHistory = typeof statusHistory.$inferSelect;