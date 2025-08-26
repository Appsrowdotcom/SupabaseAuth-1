import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";

// Lazy-loaded pages to reduce initial bundle size
const Login = lazy(() => import("@/pages/Login"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const UserDashboard = lazy(() => import("@/pages/UserDashboard"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const TaskListPage = lazy(() => import("@/pages/TaskListPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
    <Suspense fallback={(
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading page...</p>
        </div>
      </div>
    )}>
      {!user ? (
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
      )}
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
