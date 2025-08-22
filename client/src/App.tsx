import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "@/pages/Login";
import PMDashboard from "@/pages/PMDashboard";
import TeamDashboard from "@/pages/TeamDashboard";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

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

  if (!user) {
    return <Login />;
  }

  // Redirect based on user role
  return (
    <Switch>
      <Route path="/pm-dashboard">
        <ProtectedRoute allowedRoles={["pm"]}>
          <PMDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/team-dashboard">
        <ProtectedRoute allowedRoles={["team_member"]}>
          <TeamDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        {user.role === "pm" ? <PMDashboard /> : <TeamDashboard />}
      </Route>
      <Route component={NotFound} />
    </Switch>
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
