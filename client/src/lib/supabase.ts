import { createClient } from '@supabase/supabase-js'

// Read credentials from Vite environment variables.
// Define in project-root .env/.env.local as:
// VITE_SUPABASE_URL=...
// VITE_SUPABASE_ANON_KEY=...
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear error in the console if env vars are missing
  // so the app doesn't appear to be stuck on a loading spinner.
  // The rest of the app guards will handle absence gracefully.
  // eslint-disable-next-line no-console
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Types matching the exact database schema
export interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'User'
  rank?: string
  specialization?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  type: string
  status: 'In Progress' | 'On Hold' | 'Completed' | 'Archived'
  admin_id: string
  created_at: string
  deadline?: string
}

export interface Task {
  id: string
  project_id: string
  name: string
  type: string
  status: 'To Do' | 'In Progress' | 'On Hold' | 'Review' | 'Completed'
  assigned_user_id?: string
  estimate_hours?: number
  created_at: string
}

export interface WorkLog {
  id: string
  user_id: string
  project_id: string
  task_id?: string
  start_time: string
  end_time: string
  note?: string
}

export interface StatusHistory {
  id: string
  entity_type: 'project' | 'task'
  entity_id: string
  status: string
  updated_by: string
  updated_at: string
}
