"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore, Task } from "@/app/store/useProjectStore";
import { useAuthStore } from "@/app/store/useAuthStore";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function TaskDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const taskId = params.taskId as string;
  const router = useRouter();

  const {
    currentProject,
    fetchProjectById,
    loading,
    updateTask,
    deleteTask,
    taskComments,
    taskLogs,
    hasMoreComments,
    totalComments,
    fetchTaskComments,
    fetchTaskLogs,
    addTaskComment,
    resetComments,
  } = useProjectStore();

  const { user } = useAuthStore();
  const [task, setTask] = useState<Task | undefined>(undefined);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [availableUsers, setAvailableUsers] = useState<
    { id: string; username: string }[]
  >([]);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isFetchingComments, setIsFetchingComments] = useState(false);

  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!currentProject || currentProject.id !== projectId) {
      fetchProjectById(projectId);
    }
  }, [projectId, currentProject, fetchProjectById, router]);

  useEffect(() => {
    if (currentProject && currentProject.tasks) {
      const foundTask = currentProject.tasks.find((t) => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
        if (!isEditingTitle) setEditTitle(foundTask.title);
        if (!isEditingDesc) setEditDesc(foundTask.description || "");
      } else if (!loading) {
        router.push(`/projects/${projectId}`);
      }
    }
  }, [currentProject, taskId, loading, router, isEditingTitle, isEditingDesc]);

  useEffect(() => {
    if (currentProject?.members) {
      const users = [...currentProject.members];
      if (currentProject.creator) {
        if (!users.find((u) => u.id === currentProject.creator.id)) {
          users.push(currentProject.creator);
        }
      }
      setAvailableUsers(users);
    }
  }, [currentProject]);

  useEffect(() => {
    if (taskId) {
      const init = async () => {
        resetComments();
        setPage(1);
        fetchTaskComments(taskId, 1);
        fetchTaskLogs(taskId);
      };
      init();
    }
  }, [taskId]);

  const loadNextPage = async () => {
    setIsFetchingComments(true);
    const nextPage = page + 1;
    await fetchTaskComments(taskId, nextPage);
    setPage(nextPage);
    setIsFetchingComments(false);
  };

  const lastCommentElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingComments) return;
      // console.log(observer.current);
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMoreComments) {
            loadNextPage();
          }
        },
        {
          threshold: 1.0,
          rootMargin: "0px",
        }
      );

      if (node) observer.current.observe(node);
    },
    [hasMoreComments, taskId, fetchTaskComments, isFetchingComments]
  );

  const canEdit = !!user;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsCommentLoading(true);
    try {
      await addTaskComment(taskId, newComment);
      setNewComment("");
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleUpdateStatus = async (val: string) => {
    if (!task) return;
    try {
      await updateTask(task.id, { status: val });
      toast.success("Status Updated");
    } catch (error: any) {
      toast.error("Update Failed", {
        description:
          error.response?.data?.message || "Invalid status transition.",
      });
    }
  };

  const handleUpdatePriority = async (val: string) => {
    if (!task) return;
    await updateTask(task.id, { priority: val });
    toast.success("Priority Updated");
  };

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!task) return;
    if (!selectedDate) {
      await updateTask(task.id, { due_date: null });
      toast.success("Date Cleared");
      return;
    }
    const newDate = new Date(selectedDate);
    if (task.due_date) {
      const current = new Date(task.due_date);
      newDate.setHours(current.getHours(), current.getMinutes());
    } else {
      newDate.setHours(12, 0);
    }
    await updateTask(task.id, { due_date: newDate.toISOString() });
    toast.success("Date Updated");
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !task.due_date) return;
    const timeStr = e.target.value;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const newDate = new Date(task.due_date);
    newDate.setHours(hours, minutes);
    await updateTask(task.id, { due_date: newDate.toISOString() });
    toast.success("Time Updated");
  };

  const handleUpdateAssignee = async (userId: string | null) => {
    if (!task) return;
    await updateTask(task.id, { assigned_to_id: userId });
    setIsAssigneeOpen(false);
    toast.success(userId ? "Member Assigned" : "Member Unassigned");
  };

  const handleSaveTitle = async () => {
    if (!task || !editTitle.trim()) return;
    await updateTask(task.id, { title: editTitle });
    setIsEditingTitle(false);
    toast.success("Title Saved");
  };

  const handleSaveDesc = async () => {
    if (!task) return;
    await updateTask(task.id, { description: editDesc });
    setIsEditingDesc(false);
    toast.success("Description Saved");
  };

  const handleDelete = async () => {
    if (confirm("Are you sure? This cannot be undone.")) {
      await deleteTask(taskId);
      toast.success("Task Deleted");
      router.push(`/projects/${projectId}`);
    }
  };

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

  if (loading || !task) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-gray-500">
        <Spinner />
      </div>
    );
  }

  const createdDate = task.created_at;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-900 gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </Button>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 min-h-[calc(100vh-60px)]">
        <div className="lg:col-span-3 p-6 md:p-10 space-y-8">
          <div className="space-y-4">
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

            <div className="group relative">
              {isEditingTitle ? (
                <div className="space-y-2">
                  <Textarea
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-4xl font-bold min-h-[60px] resize-none overflow-hidden bg-white px-2 py-1 -ml-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveTitle();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveTitle}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingTitle(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <h1
                  onClick={() => canEdit && setIsEditingTitle(true)}
                  className={cn(
                    "text-4xl font-bold text-gray-900 leading-tight break-words whitespace-pre-wrap border border-transparent rounded px-2 -ml-2 py-1 transition-all",
                    canEdit && "hover:bg-gray-100 cursor-pointer"
                  )}
                >
                  {task.title}
                </h1>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            {isEditingDesc ? (
              <div className="space-y-3">
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="h-[250px] resize-none overflow-y-auto text-base leading-relaxed p-4"
                  autoFocus
                />
                <div className="flex gap-2 justify-start">
                  <Button size="sm" onClick={handleSaveDesc}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingDesc(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => canEdit && setIsEditingDesc(true)}
                className={cn(
                  "prose max-w-none text-gray-700 p-4 rounded-lg border min-h-[150px] whitespace-pre-wrap break-words transition-all",
                  canEdit
                    ? "hover:bg-gray-50 hover:border-gray-300 cursor-pointer border-transparent"
                    : "border-transparent"
                )}
              >
                {task.description || (
                  <span className="text-gray-400 italic">
                    Add a description...
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />
          <div className="mt-8">
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="bg-gray-100/50">
                <TabsTrigger value="comments" className="gap-2">
                  <MessageSquare className="h-4 w-4" /> Comments (
                  {totalComments})
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <History className="h-4 w-4" /> Activity ({taskLogs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="space-y-6 pt-4">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-black text-white">
                      {user?.username.slice(0, 1).toUpperCase()}
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
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isCommentLoading}
                      >
                        {isCommentLoading ? (
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
                  {!Array.isArray(taskComments) || taskComments.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                      No comments yet.
                    </p>
                  ) : (
                    taskComments.map((comment) => (
                      <div key={comment.id} className="flex gap-4 group">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="text-xs bg-gray-200">
                            {comment.author?.username
                              ?.slice(0, 2)
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {comment.author?.username || "Unknown"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {comment.createdAt
                                ? formatDistanceToNow(
                                    new Date(comment.createdAt),
                                    { addSuffix: true }
                                  )
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
                      ref={lastCommentElementRef}
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
                  {Array.isArray(taskLogs) &&
                    taskLogs.map((log) => (
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
                  {(!Array.isArray(taskLogs) || taskLogs.length === 0) && (
                    <p className="text-gray-400 text-sm pl-8">
                      No activity recorded yet.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="lg:col-span-1 border-l bg-gray-50/50 p-6 space-y-8">
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Details
            </h4>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">
                Assignee
              </label>
              <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
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
                        <CommandItem
                          onSelect={() => handleUpdateAssignee(null)}
                        >
                          <div className="flex items-center gap-2 text-gray-500">
                            <X className="h-4 w-4" /> Unassign
                          </div>
                        </CommandItem>
                        {availableUsers.map((u) => (
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
              <label className="text-xs font-medium text-gray-500">
                Due Date
              </label>
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
                    selected={
                      task.due_date ? new Date(task.due_date) : undefined
                    }
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Time
                    </Label>
                    <Input
                      type="time"
                      value={
                        task.due_date
                          ? format(new Date(task.due_date), "HH:mm")
                          : "12:00"
                      }
                      onChange={handleTimeChange}
                      disabled={!task.due_date}
                      className="w-full"
                    />
                  </div>
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
                {createdDate
                  ? format(new Date(createdDate), "MMM d, yyyy")
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
