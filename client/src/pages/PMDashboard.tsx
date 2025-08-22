import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectList } from "@/components/projects/ProjectList";
import { useLocation } from "wouter";
import { CheckCircle2, BarChart3, Users, LogOut, Plus } from "lucide-react";

export default function PMDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-slate-800" data-testid="page-title">
                  Project Manager Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600" data-testid="user-email">
                {user?.email}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                data-testid="button-logout"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Active Projects</p>
                  <p className="text-2xl font-semibold text-slate-800" data-testid="stat-active-projects">
                    0
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Team Members</p>
                  <p className="text-2xl font-semibold text-slate-800" data-testid="stat-team-members">
                    0
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                  <p className="text-2xl font-semibold text-slate-800" data-testid="stat-completion-rate">
                    0%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Recent Projects</h2>
            <Button 
              onClick={() => setLocation("/projects/new")}
              className="bg-primary hover:bg-blue-600"
              data-testid="button-create-project"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
          <ProjectList />
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline"
              onClick={() => setLocation("/projects")}
              data-testid="button-view-all-projects"
            >
              View All Projects
            </Button>
          </div>
        </div>

        {/* Team Management */}
        <Card className="border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Team Overview</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-slate-800 mb-3">Active Team Members</h3>
                <div className="text-center py-8" data-testid="empty-team">
                  <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">No team members yet</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-slate-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                    data-testid="button-create-project-quick"
                  >
                    + Create New Project
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                    data-testid="button-invite-member"
                  >
                    + Invite Team Member
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                    data-testid="button-view-reports"
                  >
                    📊 View Reports
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
