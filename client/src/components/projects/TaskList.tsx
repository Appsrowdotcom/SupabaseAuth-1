import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ListTodo, 
  Eye, 
  User,
  Loader2 
} from "lucide-react";
import { Task, User as UserType } from "@shared/schema";

interface TaskListProps {
  projectId: string;
  tasks: Task[];
  isLoading: boolean;
}

export function TaskList({ projectId, tasks, isLoading }: TaskListProps) {
  // Fetch user data for assigned members
  const { data: usersData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
  });

  const currentUser = usersData?.user;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "Review":
        return <Eye className="h-4 w-4 text-purple-600" />;
      case "On Hold":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <ListTodo className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="tasks-loading">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-slate-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8" data-testid="empty-tasks">
        <ListTodo className="h-8 w-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-600">No tasks found for this project</p>
        <p className="text-xs text-slate-500 mt-1">
          {currentUser?.role === "PM" 
            ? "Create tasks to get started" 
            : "Check back later for new assignments"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card 
          key={task.id} 
          className="border border-slate-200 bg-slate-50"
          data-testid={`task-${task.id}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(task.status)}
                  <h5 
                    className="font-medium text-slate-800 truncate"
                    data-testid={`task-name-${task.id}`}
                  >
                    {task.name}
                  </h5>
                </div>
                
                <div className="flex items-center space-x-3 text-sm text-slate-600 mb-2">
                  <span className="bg-white px-2 py-1 rounded border">
                    {task.type}
                  </span>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-4">
                    {task.assignedTo && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>
                          {task.assignedTo === currentUser?.id ? "You" : "Assigned"}
                        </span>
                      </div>
                    )}
                    {task.estimateHours && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimateHours}h estimated</span>
                      </div>
                    )}
                  </div>
                  
                  {task.assignedTo === currentUser?.id && task.status !== "Completed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      data-testid={`update-task-${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement task update functionality
                      }}
                    >
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}