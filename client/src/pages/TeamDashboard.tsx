import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectList } from "@/components/projects/ProjectList";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, LogOut } from "lucide-react";

export default function TeamDashboard() {
  const { user, signOut } = useAuth();

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
                <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-slate-800" data-testid="page-title">
                  Team Member Dashboard
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
        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ListTodo className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Open Tasks</p>
                  <p className="text-2xl font-semibold text-slate-800" data-testid="stat-open-tasks">
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
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-2xl font-semibold text-slate-800" data-testid="stat-completed-tasks">
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
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">In Progress</p>
                  <p className="text-2xl font-semibold text-slate-800" data-testid="stat-in-progress-tasks">
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
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Overdue</p>
                  <p className="text-2xl font-semibold text-slate-800" data-testid="stat-overdue-tasks">
                    0
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects and Tasks Section */}
        <div className="mb-8">
          <ProjectList />
        </div>

        {/* Recent Activity */}
        <Card className="border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
          </div>
          <CardContent className="p-6">
            <div className="text-center py-12" data-testid="empty-activity">
              <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No recent activity</h3>
              <p className="text-slate-600">Your activity will appear here once you start working on tasks.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
