// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { insertTaskSchema } from "@/lib/schemas";
// import { useAuth } from "@/lib/auth";
// import { useToast } from "@/hooks/use-toast";

// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// import { 
//   CheckCircle2, 
//   Clock, 
//   AlertTriangle, 
//   ListTodo, 
//   Eye, 
//   User,
//   Loader2,
//   Plus,
//   Edit,
//   Trash2,
//   Users
// } from "lucide-react";
// import { Task, User as UserType, TaskStatus } from "@/lib/schemas";

// interface TaskListProps {
//   projectId: string;
//   tasks: Task[];
//   isLoading: boolean;
// }

// const taskFormSchema = insertTaskSchema.extend({
//   name: z.string().min(1, "Task name is required").min(3, "Task name must be at least 3 characters"),
//   type: z.string().min(1, "Task type is required"),
//   estimateHours: z.string().optional(),
// });

// type TaskFormData = z.infer<typeof taskFormSchema>;

// const TASK_TYPES = [
//   "design",
//   "development", 
//   "seo",
//   "content",
//   "testing",
//   "research",
//   "planning",
//   "review",
//   "other"
// ];

// const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "On Hold", "Review", "Completed"];

// export function TaskList({ projectId, tasks, isLoading }: TaskListProps) {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
//   const [editingTask, setEditingTask] = useState<Task | null>(null);

//   // Fetch team members for assignment
//   const { data: usersData } = useQuery({
//     queryKey: ["/api/users"],
//     queryFn: async () => {
//       const response = await fetch("/api/users", { credentials: "include" });
//       if (!response.ok) throw new Error("Failed to fetch users");
//       return response.json();
//     },
//     enabled: user?.role === "PM",
//   });

//   const teamMembers: UserType[] = usersData?.users?.filter((u: UserType) => u.role === "Team") || [];

//   // Create task mutation
//   const createTaskMutation = useMutation({
//     mutationFn: async (data: TaskFormData) => {
//       const taskData = {
//         ...data,
//         projectId,
//         estimateHours: data.estimateHours || null,
//       };
      
//       const response = await fetch("/api/tasks", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(taskData),
//       });
      
//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || "Failed to create task");
//       }
      
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
//       toast({ title: "Task Created", description: "New task has been created successfully." });
//       setIsCreateDialogOpen(false);
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to create task. Please try again.",
//         variant: "destructive",
//       });
//     },
//   });

//   // Update task mutation
//   const updateTaskMutation = useMutation({
//     mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<Task> }) => {
//       const response = await fetch(`/api/tasks/${taskId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(data),
//       });
      
//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || "Failed to update task");
//       }
      
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
//       toast({ title: "Task Updated", description: "Task has been updated successfully." });
//       setEditingTask(null);
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to update task. Please try again.",
//         variant: "destructive",
//       });
//     },
//   });

//   // Delete task mutation
//   const deleteTaskMutation = useMutation({
//     mutationFn: async (taskId: string) => {
//       const response = await fetch(`/api/tasks/${taskId}`, {
//         method: "DELETE",
//         credentials: "include",
//       });
      
//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || "Failed to delete task");
//       }
      
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
//       toast({ title: "Task Deleted", description: "Task has been deleted successfully." });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to delete task. Please try again.",
//         variant: "destructive",
//       });
//     },
//   });

//   const createForm = useForm<TaskFormData>({
//     resolver: zodResolver(taskFormSchema),
//     defaultValues: {
//       name: "",
//       type: "",
//       status: "To Do",
//       assignedTo: "",
//       estimateHours: "",
//       projectId,
//     },
//   });

//   const editForm = useForm<TaskFormData>({
//     resolver: zodResolver(taskFormSchema),
//     defaultValues: {
//       name: "",
//       type: "",
//       status: "To Do",
//       assignedTo: "",
//       estimateHours: "",
//       projectId,
//     },
//   });

//   const onCreateSubmit = (data: TaskFormData) => {
//     createTaskMutation.mutate(data);
//   };

//   const onEditSubmit = (data: TaskFormData) => {
//     if (!editingTask) return;
//     updateTaskMutation.mutate({
//       taskId: editingTask.id,
//       data: {
//         ...data,
//         estimateHours: data.estimateHours || null,
//       }
//     });
//   };

//   const handleStatusUpdate = (taskId: string, newStatus: TaskStatus) => {
//     updateTaskMutation.mutate({
//       taskId,
//       data: { status: newStatus }
//     });
//   };

//   const handleDeleteTask = (taskId: string) => {
//     deleteTaskMutation.mutate(taskId);
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "Completed":
//         return <CheckCircle2 className="h-4 w-4 text-green-600" />;
//       case "In Progress":
//         return <Clock className="h-4 w-4 text-blue-600" />;
//       case "Review":
//         return <Eye className="h-4 w-4 text-purple-600" />;
//       case "On Hold":
//         return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
//       default:
//         return <ListTodo className="h-4 w-4 text-slate-500" />;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "Completed":
//         return "bg-green-100 text-green-800 border-green-200";
//       case "In Progress":
//         return "bg-blue-100 text-blue-800 border-blue-200";
//       case "Review":
//         return "bg-purple-100 text-purple-800 border-purple-200";
//       case "On Hold":
//         return "bg-yellow-100 text-yellow-800 border-yellow-200";
//       default:
//         return "bg-slate-100 text-slate-800 border-slate-200";
//     }
//   };

//   const getAssignedMemberName = (assignedTo: string | null) => {
//     if (!assignedTo) return "Unassigned";
//     if (assignedTo === user?.id) return "You";
//     const member = teamMembers.find(m => m.id === assignedTo);
//     return member?.name || "Unknown";
//   };

//   // Filter tasks based on user role
//   const visibleTasks = user?.role === "PM" 
//     ? tasks 
//     : tasks.filter(task => task.assignedTo === user?.id);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-8" data-testid="tasks-loading">
//         <div className="text-center">
//           <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
//           <p className="text-sm text-slate-600">Loading tasks...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {/* Header with Add Task Button for PMs */}
//       {user?.role === "PM" && (
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-2">
//             <Users className="h-5 w-5 text-slate-500" />
//             <h3 className="text-lg font-medium text-slate-800">
//               Task Management ({visibleTasks.length} tasks)
//             </h3>
//           </div>
          
//           <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
//             <DialogTrigger asChild>
//               <Button 
//                 className="bg-primary hover:bg-blue-600"
//                 data-testid="button-add-task"
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add Task
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-md">
//               <DialogHeader>
//                 <DialogTitle>Create New Task</DialogTitle>
//               </DialogHeader>
//               <Form {...createForm}>
//                 <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
//                   <FormField
//                     control={createForm.control}
//                     name="name"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Task Name *</FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder="Enter task name"
//                             data-testid="input-task-name"
//                             {...field}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={createForm.control}
//                     name="type"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Task Type *</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value}>
//                           <FormControl>
//                             <SelectTrigger data-testid="select-task-type">
//                               <SelectValue placeholder="Select task type" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {TASK_TYPES.map((type) => (
//                               <SelectItem key={type} value={type}>
//                                 {type.charAt(0).toUpperCase() + type.slice(1)}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={createForm.control}
//                     name="assignedTo"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Assign To</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value}>
//                           <FormControl>
//                             <SelectTrigger data-testid="select-assigned-to">
//                               <SelectValue placeholder="Select team member" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="">Unassigned</SelectItem>
//                             {teamMembers.map((member) => (
//                               <SelectItem key={member.id} value={member.id}>
//                                 {member.name} ({member.specialization})
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={createForm.control}
//                     name="estimateHours"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Estimated Hours</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             placeholder="Enter estimated hours"
//                             data-testid="input-estimate-hours"
//                             {...field}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <div className="flex justify-end space-x-2">
//                     <Button 
//                       type="button" 
//                       variant="outline"
//                       onClick={() => setIsCreateDialogOpen(false)}
//                       disabled={createTaskMutation.isPending}
//                     >
//                       Cancel
//                     </Button>
//                     <Button 
//                       type="submit" 
//                       disabled={createTaskMutation.isPending}
//                       data-testid="button-create-task"
//                     >
//                       {createTaskMutation.isPending ? (
//                         <>
//                           <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                           Creating...
//                         </>
//                       ) : (
//                         <>
//                           <Plus className="h-4 w-4 mr-2" />
//                           Create Task
//                         </>
//                       )}
//                     </Button>
//                   </div>
//                 </form>
//               </Form>
//             </DialogContent>
//           </Dialog>
//         </div>
//       )}

//       {/* Tasks List */}
//       {visibleTasks.length === 0 ? (
//         <Card className="border border-slate-200">
//           <CardContent className="text-center py-12" data-testid="empty-tasks">
//             <ListTodo className="h-12 w-12 text-slate-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-slate-900 mb-2">
//               {user?.role === "PM" ? "No tasks yet" : "No tasks assigned"}
//             </h3>
//             <p className="text-slate-600">
//               {user?.role === "PM" 
//                 ? "Create your first task to get started." 
//                 : "You don't have any tasks assigned yet. Check back later."}
//             </p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-3">
//           {visibleTasks.map((task) => (
//             <Card 
//               key={task.id} 
//               className="border border-slate-200 hover:shadow-sm transition-shadow"
//               data-testid={`task-${task.id}`}
//             >
//               <CardContent className="p-4">
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center space-x-2 mb-2">
//                       {getStatusIcon(task.status)}
//                       <h5 
//                         className="font-medium text-slate-800 truncate"
//                         data-testid={`task-name-${task.id}`}
//                       >
//                         {task.name}
//                       </h5>
//                     </div>
                    
//                     <div className="flex items-center space-x-3 text-sm text-slate-600 mb-3">
//                       <span className="bg-slate-100 px-2 py-1 rounded border text-xs">
//                         {task.type}
//                       </span>
//                       <Badge className={getStatusColor(task.status)}>
//                         {task.status}
//                       </Badge>
//                       <span className="flex items-center space-x-1">
//                         <User className="h-3 w-3" />
//                         <span>{getAssignedMemberName(task.assignedTo)}</span>
//                       </span>
//                       {task.estimateHours && (
//                         <span className="flex items-center space-x-1">
//                           <Clock className="h-3 w-3" />
//                           <span>{task.estimateHours}h</span>
//                         </span>
//                       )}
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex items-center justify-between">
//                       <div className="text-xs text-slate-500">
//                         Created {new Date(task.createdAt || new Date()).toLocaleDateString()}
//                       </div>
                      
//                       <div className="flex items-center space-x-2">
//                         {/* Team member status update */}
//                         {task.assignedTo === user?.id && task.status !== "Completed" && (
//                           <Select
//                             value={task.status}
//                             onValueChange={(value) => handleStatusUpdate(task.id, value as TaskStatus)}
//                           >
//                             <SelectTrigger className="w-32 h-7 text-xs" data-testid={`update-status-${task.id}`}>
//                               <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent>
//                               {TASK_STATUSES.map((status) => (
//                                 <SelectItem key={status} value={status}>
//                                   {status}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                         )}

//                         {/* PM actions */}
//                         {user?.role === "PM" && (
//                           <>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               onClick={() => {
//                                 setEditingTask(task);
//                                 editForm.reset({
//                                   name: task.name,
//                                   type: task.type,
//                                   status: task.status,
//                                   assignedTo: task.assignedTo || undefined,
//                                   estimateHours: task.estimateHours || undefined,
//                                   projectId,
//                                 });
//                               }}
//                               data-testid={`edit-task-${task.id}`}
//                             >
//                               <Edit className="h-3 w-3" />
//                             </Button>
                            
//                             <AlertDialog>
//                               <AlertDialogTrigger asChild>
//                                 <Button
//                                   size="sm"
//                                   variant="ghost"
//                                   className="text-red-600 hover:text-red-700 hover:bg-red-50"
//                                   data-testid={`delete-task-${task.id}`}
//                                 >
//                                   <Trash2 className="h-3 w-3" />
//                                 </Button>
//                               </AlertDialogTrigger>
//                               <AlertDialogContent>
//                                 <AlertDialogHeader>
//                                   <AlertDialogTitle>Delete Task</AlertDialogTitle>
//                                   <AlertDialogDescription>
//                                     Are you sure you want to delete "{task.name}"? This action cannot be undone.
//                                   </AlertDialogDescription>
//                                 </AlertDialogHeader>
//                                 <AlertDialogFooter>
//                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
//                                   <AlertDialogAction
//                                     onClick={() => handleDeleteTask(task.id)}
//                                     className="bg-red-600 hover:bg-red-700"
//                                   >
//                                     Delete
//                                   </AlertDialogAction>
//                                 </AlertDialogFooter>
//                               </AlertDialogContent>
//                             </AlertDialog>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Edit Task Dialog */}
//       <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Edit Task</DialogTitle>
//           </DialogHeader>
//           <Form {...editForm}>
//             <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
//               <FormField
//                 control={editForm.control}
//                 name="name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Task Name *</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="Enter task name"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={editForm.control}
//                 name="type"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Task Type *</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select task type" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {TASK_TYPES.map((type) => (
//                           <SelectItem key={type} value={type}>
//                             {type.charAt(0).toUpperCase() + type.slice(1)}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={editForm.control}
//                 name="status"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Status</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select status" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {TASK_STATUSES.map((status) => (
//                           <SelectItem key={status} value={status}>
//                             {status}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={editForm.control}
//                 name="assignedTo"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Assign To</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select team member" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         <SelectItem value="">Unassigned</SelectItem>
//                         {teamMembers.map((member) => (
//                           <SelectItem key={member.id} value={member.id}>
//                             {member.name} ({member.specialization})
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={editForm.control}
//                 name="estimateHours"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Estimated Hours</FormLabel>
//                     <FormControl>
//                       <Input
//                         type="number"
//                         placeholder="Enter estimated hours"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <div className="flex justify-end space-x-2">
//                 <Button 
//                   type="button" 
//                   variant="outline"
//                   onClick={() => setEditingTask(null)}
//                   disabled={updateTaskMutation.isPending}
//                 >
//                   Cancel
//                 </Button>
//                 <Button 
//                   type="submit" 
//                   disabled={updateTaskMutation.isPending}
//                 >
//                   {updateTaskMutation.isPending ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                       Updating...
//                     </>
//                   ) : (
//                     "Update Task"
//                   )}
//                 </Button>
//               </div>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }