"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore, Task } from "@/app/store/useProjectStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Tag,
  CheckCircle2,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDialog } from "@/components/ui/TaskDialog";

export default function TaskDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const taskId = params.taskId as string;
  const router = useRouter();

  const { currentProject, fetchProjectById, loading, deleteTask } =
    useProjectStore();

  const { user } = useAuthStore();

  const [task, setTask] = useState<Task | undefined>(undefined);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!currentProject || currentProject.id !== projectId) {
      fetchProjectById(projectId);
    }
  }, [projectId, currentProject, fetchProjectById]);

  useEffect(() => {
    if (currentProject && currentProject.tasks) {
      const foundTask = currentProject.tasks?.find((t) => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
      } else if (!loading) {
        router.push(`/projects/${projectId}`);
      }
    }
  }, [currentProject, taskId, loading, router]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
      router.push(`/projects/${projectId}`);
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === "High")
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
    if (p === "Medium")
      return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
    return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
  };

  const getStatusColor = (s: string) => {
    if (s === "Done") return "bg-green-600 text-white hover:bg-green-700";
    if (s === "In Progress") return "bg-blue-600 text-white hover:bg-blue-700";
    return "bg-slate-500 text-white hover:bg-slate-600";
  };

  if (loading || !task) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading task details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-gray-500 hover:text-gray-900 pl-0 hover:bg-transparent"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project
          </Button>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(task.priority)}
                      >
                        {task.priority} Priority
                      </Badge>
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900 leading-tight">
                      {task.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                      Description
                    </h3>
                    <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap leading-relaxed">
                      {task.description || "No description provided."}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="h-4 w-4" /> Assigned To
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white border rounded-md">
                    {task.assignee ? (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                            {task.assignee.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {task.assignee.username}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            Member
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" /> Due Date
                  </div>
                  <div className="font-medium text-gray-900">
                    {task.due_date ? (
                      <span
                        className={
                          new Date(task.due_date) < new Date() &&
                          task.status !== "Done"
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {format(new Date(task.due_date), "PPP")}
                      </span>
                    ) : (
                      <span className="text-gray-400">No date set</span>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Created
                    </span>
                    <span className="text-gray-900">
                      {task.created_at
                        ? format(new Date(task.created_at), "MMM d, yyyy")
                        : "-"}
                    </span>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <TaskDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        project_id={projectId}
        taskToEdit={task}
      />
    </div>
  );
}
