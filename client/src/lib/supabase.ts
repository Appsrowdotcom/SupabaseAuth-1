import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hntwxvzuothnkhtahmoz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhudHd4dnp1b3RobmtodGFobW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTkzMTUsImV4cCI6MjA3MTQzNTMxNX0.sgxhv2tc0KWo_cx6eEWgUKBm7MI1sF3qJ_A5GbCT9nA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  status: 'In Progress' | 'On Hold' | 'Completed'
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
