import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";
// Avoid lazy loading during debugging to prevent Suspense spinner masking issues
// You can revert to lazy imports once the app is stable

import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import UserDashboard from "@/pages/UserDashboard";
import ProjectsPage from "@/pages/ProjectsPage";
import TaskListPage from "@/pages/TaskListPage";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="app-loading">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    !user ? (
      <Login />
    ) : (
      <Switch>
        <Route path="/admin/dashboard">
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/user/dashboard">
          <ProtectedRoute allowedRoles={["User"]}>
            <UserDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/projects">
          <ProtectedRoute allowedRoles={["Admin"]}>
            <ProjectsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/projects/:id/tasks">
          <ProtectedRoute allowedRoles={["Admin"]}>
            <TaskListPage />
          </ProtectedRoute>
        </Route>
        <Route path="/">
          {user.role === "Admin" ? <AdminDashboard /> : <UserDashboard />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    )
  );
}

function App() {
  // If Supabase was initialized with missing credentials, surface a clear message
  const credsMissing = (supabase as any).supabaseUrl === "" || (supabase as any).supabaseKey === "";
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {credsMissing ? (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-lg text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Supabase credentials missing</h1>
              <p className="text-slate-600 mb-4">Create <code>client/.env.local</code> with your project values and restart the dev server.</p>
              <pre className="text-left bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-auto">
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
              </pre>
            </div>
          </div>
        ) : (
          <AuthProvider>
            <Toaster />
            <AppRouter />
          </AuthProvider>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
