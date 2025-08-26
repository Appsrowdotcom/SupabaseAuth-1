import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  FolderOpen, 
  Clock, 
  Plus,
  LogOut,
  Settings,
  BarChart3
} from "lucide-react";
import { AdminProjectOverview } from "@/components/admin/AdminProjectOverview";
import { AdminTeamProductivity } from "@/components/admin/AdminTeamProductivity";
import { AdminTaskAnalytics } from "@/components/admin/AdminTaskAnalytics";
import { AdminTimeReports } from "@/components/admin/AdminTimeReports";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-slate-900">
                Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {user?.role}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, {user?.name}! 👋</h2>
          <p className="text-slate-600">Monitor your projects, team productivity, and time tracking.</p>
        </div>

        <AdminProjectOverview />
        <AdminTeamProductivity />
        <AdminTaskAnalytics />
        <AdminTimeReports />
      </main>
    </div>
  );
}
