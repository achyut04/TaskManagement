"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Trash2,
  Check,
  X,
  Flag,
  CircleDot,
  AlertCircle,
  Send,
  MessageSquare,
  Activity,
  History,
  Paperclip,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import API from "@/app/utils/api";
import { useProjectStore, Task, Project } from "@/app/store/useProjectStore";
import { useAuthStore } from "@/app/store/useAuthStore";

export default function TaskDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const taskId = params.taskId as string;
  const router = useRouter();

  const {
    currentProject,
    fetchProjectById,
    loading,
    currentTask,
    updateTask,
    deleteTask,
    resetComments,
    fetchTaskComments,
    fetchTaskLogs,
    fetchTaskById,
  } = useProjectStore();

  const { user } = useAuthStore();
  const [deleteTaskDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!currentProject || currentProject.id !== projectId) {
      fetchProjectById(projectId).catch(() => router.push("/dashboard"));
    }
  }, [projectId, currentProject, fetchProjectById, router]);

  useEffect(() => {
    if (taskId) {
      fetchTaskById(taskId);
      resetComments();
      fetchTaskComments(taskId, 1);
      fetchTaskLogs(taskId);
    }
  }, [taskId]);

  const handleDeleteTask = async () => {
    await deleteTask(taskId);
    toast.success("Task Deleted");
    router.push(`/projects/${projectId}`);
  };

  const canEdit = !!user;

  if ((loading && !currentTask) || !currentTask) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-gray-500">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <TaskHeader
            onBack={() => router.back()}
            onDelete={() => setDeleteDialogOpen(true)}
            canEdit={canEdit}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 p-6 md:p-10 space-y-8 bg-white rounded-xl shadow-sm border h-fit">
              <div className="space-y-4">
                <TaskMetaSelectors
                  task={currentTask}
                  canEdit={canEdit}
                  onUpdate={updateTask}
                />
                <TaskTitle
                  task={currentTask}
                  canEdit={canEdit}
                  onUpdate={updateTask}
                />
              </div>

              <Separator />

              <TaskDescription
                task={currentTask}
                canEdit={canEdit}
                onUpdate={updateTask}
              />

              <Separator />

              <TaskAttachments taskId={taskId} canEdit={canEdit} />

              <Separator />

              <TaskActivity taskId={taskId} currentUser={user} />
            </div>

            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 h-fit">
              <TaskSidebar
                task={currentTask}
                project={currentProject}
                canEdit={canEdit}
                onUpdate={updateTask}
              />
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={deleteTaskDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone. This will permanently
              delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface TaskProps {
  task: Task;
  canEdit: boolean;
  onUpdate: (id: string, data: any) => Promise<void>;
}

function TaskHeader({ onBack, onDelete, canEdit }: any) {
  return (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="gap-2 bg-white hover:bg-gray-100 border-gray-200 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Button>

      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 shadow-sm gap-2"
        >
          <Trash2 className="h-4 w-4" /> Delete Task
        </Button>
      )}
    </div>
  );
}

function TaskMetaSelectors({ task, canEdit, onUpdate }: TaskProps) {
  const { fetchTaskLogs } = useProjectStore();
  const getPriorityStyles = (p: string) => {
    if (p === "High") return "text-red-700 bg-red-50 border-red-200";
    if (p === "Medium") return "text-yellow-700 bg-yellow-50 border-yellow-200";
    return "text-green-700 bg-green-50 border-green-200";
  };

  const getStatusStyles = (s: string) => {
    if (s === "Done") return "bg-green-100 text-green-700 hover:bg-green-200";
    if (s === "In Progress")
      return "bg-blue-100 text-blue-700 hover:bg-blue-200";
    if (s === "Overdue") return "bg-red-100 text-red-700 hover:bg-red-200";
    return "bg-slate-100 text-slate-700 hover:bg-slate-200";
  };

  const handleUpdateStatus = async (val: string) => {
    try {
      await onUpdate(task.id, { status: val });
      await fetchTaskLogs(task.id);
      toast.success("Status Updated");
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message || "Invalid transition",
      });
    }
  };

  const handleUpdatePriority = async (val: string) => {
    await onUpdate(task.id, { priority: val });
    await fetchTaskLogs(task.id);
    toast.success("Priority Updated");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        disabled={!canEdit}
        value={task.status}
        onValueChange={handleUpdateStatus}
      >
        <SelectTrigger
          className={cn(
            "w-auto h-8 gap-2 px-3 rounded-md border text-xs font-semibold uppercase tracking-wide transition-colors",
            task.status === "Overdue"
              ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
              : getStatusStyles(task.status)
          )}
        >
          {task.status === "Overdue" ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <CircleDot className="h-3.5 w-3.5" />
          )}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todo">Todo</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
          <SelectItem value="Overdue" disabled>
            Overdue (System)
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        disabled={!canEdit}
        value={task.priority}
        onValueChange={handleUpdatePriority}
      >
        <SelectTrigger
          className={cn(
            "w-auto h-8 gap-2 px-3 rounded-md border text-xs font-semibold uppercase tracking-wide transition-colors",
            getPriorityStyles(task.priority)
          )}
        >
          <Flag className="h-3.5 w-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Low">Low</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="High">High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function TaskTitle({ task, canEdit, onUpdate }: TaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  useEffect(() => setTitle(task.title), [task.title]);

  const handleSave = async () => {
    if (!title.trim() || title === task.title) {
      setIsEditing(false);
      return;
    }
    await onUpdate(task.id, { title });
    setIsEditing(false);
    toast.success("Title Saved");
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-4xl font-bold min-h-[60px] resize-none overflow-hidden bg-white px-2 py-1 -ml-2"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
          }}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <h1
      onClick={() => canEdit && setIsEditing(true)}
      className={cn(
        "text-4xl font-bold text-gray-900 leading-tight break-words whitespace-pre-wrap border border-transparent rounded px-2 -ml-2 py-1 transition-all",
        canEdit && "hover:bg-gray-100 cursor-pointer"
      )}
    >
      {task.title}
    </h1>
  );
}

function TaskDescription({ task, canEdit, onUpdate }: TaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [desc, setDesc] = useState(task.description || "");

  useEffect(() => setDesc(task.description || ""), [task.description]);

  const handleSave = async () => {
    if (desc === task.description) {
      setIsEditing(false);
      return;
    }
    await onUpdate(task.id, { description: desc });
    setIsEditing(false);
    toast.success("Description Saved");
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">Description</h3>
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="h-[250px] resize-none overflow-y-auto text-base leading-relaxed p-4"
            autoFocus
          />
          <div className="flex gap-2 justify-start">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => canEdit && setIsEditing(true)}
          className={cn(
            "prose max-w-none text-gray-700 p-4 rounded-lg border min-h-[150px] whitespace-pre-wrap break-words transition-all",
            canEdit
              ? "hover:bg-gray-50 hover:border-gray-300 cursor-pointer border-transparent"
              : "border-transparent"
          )}
        >
          {task.description || (
            <span className="text-gray-400 italic">Add a description...</span>
          )}
        </div>
      )}
    </div>
  );
}

function TaskAttachments({ taskId, canEdit }: any) {
  const [files, setFiles] = useState<any[]>([]);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const fetchFiles = async () => {
    try {
      const { data } = await API.get(`/tasks/${taskId}/files`);
      setFiles(data || []);
    } catch (error) {
      console.error("Failed to fetch files", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [taskId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await API.post(`/tasks/${taskId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("File uploaded");
      fetchFiles();
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await API.delete(`/tasks/${taskId}/files/${fileToDelete}`);
      toast.success("File deleted");
      fetchFiles();
    } catch (error: any) {
      toast.error("Delete failed");
    } finally {
      setFileToDelete(null);
      setIsDeleteAlertOpen(false);
    }
  };

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId);
    setIsDeleteAlertOpen(true);
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const response = await API.get(
        `/tasks/${taskId}/files/${fileId}/download`,
        {
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data || response]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Failed to download file. Please try again.");
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">Attachments</h3>
      <div className="space-y-2">
        <input
          type="file"
          ref={setFileInput}
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          disabled={!canEdit}
        />
        {canEdit && (
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <span>
                <Paperclip className="h-4 w-4" /> Attach File
              </span>
            </Button>
          </label>
        )}

        {files.length > 0 && (
          <div className="space-y-2 mt-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {file.original_filename}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({(file.file_size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDownloadFile(file.id, file.original_filename)
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TaskActivity({ taskId, currentUser }: any) {
  const {
    taskComments,
    taskLogs,
    hasMoreComments,
    totalComments,
    fetchTaskComments,
    addTaskComment,
    fetchTaskLogs,
  } = useProjectStore();
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      await addTaskComment(taskId, newComment);
      setNewComment("");
      fetchTaskComments(taskId, 1);
      fetchTaskLogs(taskId);
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setIsPosting(false);
    }
  };

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    fetchTaskComments(taskId, nextPage);
    setPage(nextPage);
  }, [page, taskId, fetchTaskComments]);

  const lastCommentRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreComments) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasMoreComments, loadMore]
  );

  return (
    <div className="mt-8">
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="bg-gray-100/50">
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Comments ({totalComments})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" /> Activity ({taskLogs?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-6 pt-4">
          <div className="flex gap-4">
            <Avatar>
              <AvatarFallback className="bg-black text-white">
                {currentUser?.username.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                className="min-h-[80px]"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handlePostComment}
                  disabled={!newComment.trim() || isPosting}
                >
                  {isPosting ? (
                    "Posting..."
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-2" /> Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!taskComments || taskComments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">
                No comments yet.
              </p>
            ) : (
              taskComments.map((comment: any) => (
                <div key={comment.id} className="flex gap-4">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs bg-gray-200">
                      {comment.author?.username?.slice(0, 2).toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {comment.author?.username || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {comment.createdAt
                          ? formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })
                          : ""}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg rounded-tl-none border border-gray-100">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            {hasMoreComments && taskComments.length > 0 && (
              <div
                ref={lastCommentRef}
                className="h-8 w-full flex justify-center items-center p-4"
              >
                <span className="text-xs text-gray-400 animate-pulse">
                  Loading more...
                </span>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <div className="relative border-l border-gray-200 ml-4 space-y-8">
            {taskLogs &&
              taskLogs.map((log: any) => (
                <div key={log.id} className="relative pl-8">
                  <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <Activity className="h-2 w-2 text-gray-500" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">
                        {log.actor.username}
                      </span>{" "}
                      {log.details.toLowerCase()}.
                    </p>
                    <span className="text-xs text-gray-400">
                      {log.createdAt
                        ? format(
                            new Date(log.createdAt),
                            "MMM d, yyyy 'at' h:mm a"
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              ))}
            {(!taskLogs || taskLogs.length === 0) && (
              <p className="text-gray-400 text-sm pl-8">
                No activity recorded.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TaskSidebarProps {
  task: Task;
  project: Project | null;
  canEdit: boolean;
  onUpdate: (id: string, data: any) => Promise<void>;
}

function TaskSidebar({ task, project, canEdit, onUpdate }: TaskSidebarProps) {
  const [openAssignee, setOpenAssignee] = useState(false);
  const { fetchTaskLogs } = useProjectStore();

  const availableUsers = project?.members ? [...project.members] : [];
  if (
    project?.creator &&
    !availableUsers.find((u: any) => u.id === project.creator.id)
  ) {
    availableUsers.push(project.creator);
  }

  const handleUpdateAssignee = async (userId: string | null) => {
    await onUpdate(task.id, { assigned_to_id: userId });
    await setOpenAssignee(false);
    await fetchTaskLogs(task.id);
    toast.success(userId ? "Member Assigned" : "Member Unassigned");
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) {
      await onUpdate(task.id, { due_date: null });
      await fetchTaskLogs(task.id);
      toast.success("Date Cleared");
      return;
    }
    const newDate = new Date(date);
    if (task.due_date) {
      const current = new Date(task.due_date);
      newDate.setHours(current.getHours(), current.getMinutes());
    } else {
      newDate.setHours(12, 0);
    }
    await onUpdate(task.id, { due_date: newDate.toISOString() });
    toast.success("Date Updated");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Details
        </h4>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500">Assignee</label>
          <Popover open={openAssignee} onOpenChange={setOpenAssignee}>
            <PopoverTrigger asChild disabled={!canEdit}>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-2 px-3 bg-white hover:bg-white text-left font-normal border-gray-200"
              >
                {task.assignee ? (
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar className="h-6 w-6 border">
                      <AvatarFallback className="bg-blue-50 text-blue-600 text-[10px] font-bold">
                        {task.assignee.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">
                      {task.assignee.username}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" /> Unassigned
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search member..." />
                <CommandList>
                  <CommandEmpty>No member found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => handleUpdateAssignee(null)}>
                      <div className="flex items-center gap-2 text-gray-500">
                        <X className="h-4 w-4" /> Unassign
                      </div>
                    </CommandItem>
                    {availableUsers.map((u: any) => (
                      <CommandItem
                        key={u.id}
                        onSelect={() => handleUpdateAssignee(u.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                            {u.username.slice(0, 1).toUpperCase()}
                          </div>
                          {u.username}
                          {task.assignee?.id === u.id && (
                            <Check className="ml-auto h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500">Due Date</label>
          <Popover>
            <PopoverTrigger asChild disabled={!canEdit}>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-white hover:bg-white border-gray-200",
                  !task.due_date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {task.due_date ? (
                  format(new Date(task.due_date), "PPP p")
                ) : (
                  <span>No date set</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={task.due_date ? new Date(task.due_date) : undefined}
                onSelect={handleDateSelect}
                initialFocus
              />
              <div className="p-2 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-red-600 h-8"
                  onClick={() => handleDateSelect(undefined)}
                >
                  Clear Date
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      <div className="space-y-4 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Created
          </span>
          <span>
            {task.createdAt
              ? format(new Date(task.createdAt), "MMM d, yyyy")
              : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
