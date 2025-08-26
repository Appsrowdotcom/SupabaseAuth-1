-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS: Team members and admins (PMs)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('Admin', 'User')),
    rank VARCHAR(50),
    specialization VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PROJECTS: Each project managed by PM/admin
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL,             -- e.g., 'Web Development', 'SEO'
    status VARCHAR(20) DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'On Hold', 'Completed')),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deadline DATE
);

-- TASKS: Work items under each project
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50),                      -- e.g., 'Design', 'Development', 'SEO'
    status VARCHAR(20) DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'On Hold', 'Review', 'Completed')),
    assigned_user_id UUID REFERENCES users(id),
    estimate_hours NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- WORK LOGS: Timer-based work session records
CREATE TABLE work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT,
    CHECK (end_time > start_time)
);

-- STATUS HISTORY: Tracking project/task workflow changes
CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(10) CHECK (entity_type IN ('project', 'task')),
    entity_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_admin_id ON projects(admin_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_user_id ON tasks(assigned_user_id);
CREATE INDEX idx_work_logs_user_id ON work_logs(user_id);
CREATE INDEX idx_work_logs_project_id ON work_logs(project_id);
CREATE INDEX idx_work_logs_task_id ON work_logs(task_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view projects they are assigned to" ON projects
  FOR SELECT USING (
    auth.uid() = admin_id OR 
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE project_id = projects.id AND assigned_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can update their own projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'Admin' AND id = admin_id
    )
  );

-- RLS Policies for tasks table
CREATE POLICY "Users can view tasks in their projects" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND admin_id = auth.uid()
    ) OR 
    assigned_user_id = auth.uid()
  );

CREATE POLICY "Admins can create tasks in their projects" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update tasks in their projects" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND admin_id = auth.uid()
    )
  );

-- RLS Policies for work_logs table
CREATE POLICY "Users can view their own work logs" ON work_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own work logs" ON work_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own work logs" ON work_logs
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for status_history table
CREATE POLICY "Users can view status history for their projects" ON status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = entity_id AND admin_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = entity_id AND assigned_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create status history" ON status_history
  FOR INSERT WITH CHECK (updated_by = auth.uid());
