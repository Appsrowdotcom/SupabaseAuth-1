import { type User, type InsertUser, type Project, type InsertProject, type Task, type InsertTask } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(email: string, password: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  
  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  getProjectsForUser(userId: string, userRole: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  
  // Task methods
  getTask(id: string): Promise<Task | undefined>;
  getTasksForProject(projectId: string): Promise<Task[]>;
  getTasksForUser(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private tasks: Map<string, Task>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample PM user
    const pmId = "pm-sample-id";
    const pmUser: User = {
      id: pmId,
      name: "Alex Johnson",
      email: "pm@example.com",
      password: "$2b$10$samplehashedpassword", // This would be properly hashed
      role: "PM",
      rank: "Senior PM",
      specialization: "Digital Marketing",
      createdAt: new Date("2024-01-01"),
    };

    // Sample team member
    const teamId = "team-sample-id";
    const teamUser: User = {
      id: teamId,
      name: "Sarah Chen",
      email: "developer@example.com",
      password: "$2b$10$samplehashedpassword", // This would be properly hashed
      role: "Team",
      rank: "Senior Developer",
      specialization: "Frontend Development",
      createdAt: new Date("2024-01-01"),
    };

    this.users.set(pmId, pmUser);
    this.users.set(teamId, teamUser);

    // Sample projects
    const project1Id = "project-1-id";
    const project1: Project = {
      id: project1Id,
      name: "E-commerce Website Redesign",
      type: "webflow",
      status: "In Progress",
      pmId: pmId,
      deadline: "2024-12-31",
      createdAt: new Date("2024-01-15"),
    };

    const project2Id = "project-2-id";
    const project2: Project = {
      id: project2Id,
      name: "Brand Logo Design",
      type: "logo design",
      status: "Completed",
      pmId: pmId,
      deadline: "2024-11-30",
      createdAt: new Date("2024-01-10"),
    };

    this.projects.set(project1Id, project1);
    this.projects.set(project2Id, project2);

    // Sample tasks
    const tasks: Task[] = [
      {
        id: "task-1-id",
        projectId: project1Id,
        name: "Create wireframes for homepage",
        type: "design",
        status: "Completed",
        assignedTo: teamId,
        estimateHours: "8",
        createdAt: new Date("2024-01-16"),
      },
      {
        id: "task-2-id",
        projectId: project1Id,
        name: "Implement responsive navigation",
        type: "development",
        status: "In Progress",
        assignedTo: teamId,
        estimateHours: "12",
        createdAt: new Date("2024-01-17"),
      },
      {
        id: "task-3-id",
        projectId: project1Id,
        name: "SEO optimization review",
        type: "SEO",
        status: "To Do",
        assignedTo: null,
        estimateHours: "6",
        createdAt: new Date("2024-01-18"),
      },
      {
        id: "task-4-id",
        projectId: project2Id,
        name: "Design logo concepts",
        type: "design",
        status: "Completed",
        assignedTo: teamId,
        estimateHours: "16",
        createdAt: new Date("2024-01-11"),
      },
    ];

    tasks.forEach(task => this.tasks.set(task.id, task));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      rank: insertUser.rank || null,
      specialization: insertUser.specialization || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  // Project methods
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsForUser(userId: string, userRole: string): Promise<Project[]> {
    const allProjects = Array.from(this.projects.values());
    
    if (userRole === "PM") {
      // PMs see projects they manage
      return allProjects.filter(project => project.pmId === userId);
    } else {
      // Team members see projects with tasks assigned to them
      const userTasks = Array.from(this.tasks.values()).filter(task => task.assignedTo === userId);
      const projectIds = new Set(userTasks.map(task => task.projectId));
      return allProjects.filter(project => projectIds.has(project.id));
    }
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      status: insertProject.status || "In Progress",
      deadline: insertProject.deadline || null,
      createdAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) {
      return undefined;
    }
    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Task methods
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksForProject(projectId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.projectId === projectId);
  }

  async getTasksForUser(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedTo === userId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      status: insertTask.status || "To Do",
      assignedTo: insertTask.assignedTo || null,
      estimateHours: insertTask.estimateHours || null,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) {
      return undefined;
    }
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const storage = new MemStorage();
