-- Project Management App SQL Schema for Supabase
-- This schema supports users, projects, tasks, work logs, and status history

-- Create enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('PM', 'Team');
    CREATE TYPE project_status AS ENUM ('In Progress', 'On Hold', 'Completed');
    CREATE TYPE task_status AS ENUM ('To Do', 'In Progress', 'On Hold', 'Review', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role user_role NOT NULL,
    rank TEXT,
    specialization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., logo design, SEO, webflow
    status project_status NOT NULL DEFAULT 'In Progress',
    pm_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deadline DATE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., design, development, SEO
    status task_status NOT NULL DEFAULT 'To Do',
    assigned_to UUID REFERENCES users(id),
    estimate_hours NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work logs table
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    task_id UUID REFERENCES tasks(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT end_time_check CHECK (end_time > start_time OR end_time IS NULL)
);

-- Status history table
CREATE TABLE IF NOT EXISTS status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_or_task_id UUID NOT NULL, -- References either projects.id or tasks.id
    status TEXT NOT NULL,
    updated_by UUID NOT NULL REFERENCES users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_pm_id ON projects(pm_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_project_id ON work_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_task_id ON work_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_status_history_project_or_task_id ON status_history(project_or_task_id);
CREATE INDEX IF NOT EXISTS idx_status_history_updated_by ON status_history(updated_by);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (except role)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- PMs can view all users
CREATE POLICY "PMs can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'PM'
        )
    );

-- Projects policies
CREATE POLICY "Users can view projects they're involved in" ON projects
    FOR SELECT USING (
        pm_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.project_id = projects.id 
            AND tasks.assigned_to = auth.uid()
        )
    );

-- PMs can manage projects they own
CREATE POLICY "PMs can manage their projects" ON projects
    FOR ALL USING (pm_id = auth.uid());

-- Tasks policies  
CREATE POLICY "Users can view tasks assigned to them or in their projects" ON tasks
    FOR SELECT USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = tasks.project_id 
            AND projects.pm_id = auth.uid()
        )
    );

-- Users can update tasks assigned to them
CREATE POLICY "Users can update assigned tasks" ON tasks
    FOR UPDATE USING (assigned_to = auth.uid());

-- PMs can manage tasks in their projects
CREATE POLICY "PMs can manage project tasks" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = tasks.project_id 
            AND projects.pm_id = auth.uid()
        )
    );

-- Work logs policies
CREATE POLICY "Users can manage their own work logs" ON work_logs
    FOR ALL USING (user_id = auth.uid());

-- PMs can view work logs for their projects
CREATE POLICY "PMs can view project work logs" ON work_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = work_logs.project_id 
            AND projects.pm_id = auth.uid()
        )
    );

-- Status history policies
CREATE POLICY "Users can view status history for accessible items" ON status_history
    FOR SELECT USING (
        -- Can view if they updated it
        updated_by = auth.uid() OR
        -- Can view if it's for a project they're PM of
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = status_history.project_or_task_id 
            AND projects.pm_id = auth.uid()
        ) OR
        -- Can view if it's for a task assigned to them
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = status_history.project_or_task_id 
            AND tasks.assigned_to = auth.uid()
        )
    );

-- Users can create status history for items they can modify
CREATE POLICY "Users can create status history" ON status_history
    FOR INSERT WITH CHECK (updated_by = auth.uid());