"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  MoreVertical,
  Trash2,
  UserPlus,
  X,
  Edit2,
  Plus,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Save,
  Search,
  Home,
  User,
  Loader2,
} from "lucide-react";

import API from "@/app/utils/api";
import { useProjectStore, Task } from "@/app/store/useProjectStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskDialog } from "@/components/ui/TaskDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
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

export default function ProjectDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    currentProject,
    loading: projectLoading,
    fetchProjectById,
    deleteTask,
    removeMember,
    addMember,
    updateProject,
  } = useProjectStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProjectById(id).catch(() => router.push("/dashboard"));
  }, [id, router, fetchProjectById]);

  const fetchTasks = useCallback(
    async (page: number, search: string) => {
      if (!id) return;
      setTasksLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });
        if (search) queryParams.append("search", search);

        const response = (await API.get(
          `/project/${id}/tasks?${queryParams}`
        )) as any;
        setTasks(response.data);
        if (response.meta?.pagination) {
          setTotalPages(response.meta.pagination.totalPages);
          setTotalTasks(response.meta.pagination.totalItems);
        }
      } catch (error) {
        console.error("Failed to fetch tasks", error);
        toast.error("Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const delay = searchQuery ? 500 : 0;
    const timeoutId = setTimeout(() => {
      const pageToFetch = searchQuery ? 1 : currentPage;
      if (searchQuery) setCurrentPage(1);

      fetchTasks(pageToFetch, searchQuery);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentPage, fetchTasks]);

  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    router.push(`/projects/${id}/tasks/${task.id}`);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTaskClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteTaskDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    await deleteTask(taskToDelete.id);
    setDeleteTaskDialogOpen(false);
    setTaskToDelete(null);
    fetchTasks(currentPage, searchQuery);
  };

  if (projectLoading || !currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isAdminOrOwner =
    user?.role === "Admin" || user?.id === currentProject.creator.id;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>

        <ProjectHeader
          project={currentProject}
          canEdit={isAdminOrOwner}
          onUpdate={updateProject}
          onCreateTask={() => {
            setTaskToEdit(undefined);
            setIsTaskModalOpen(true);
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <h3 className="font-semibold text-gray-700">Tasks</h3>
                  <Badge variant="secondary">
                    {totalTasks} {searchQuery ? "found" : "total"}
                  </Badge>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white"
                  />
                </div>
              </div>

              <TasksTable
                tasks={tasks}
                loading={tasksLoading}
                projectId={id}
                onTaskClick={handleTaskClick}
                onEdit={handleEditTask}
                onDelete={handleDeleteTaskClick}
              />
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  <span className="text-sm text-gray-500 px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          <div className="space-y-6">
            <TeamSidebar
              project={currentProject}
              currentUser={user}
              onInvite={() => setIsInviteOpen(true)}
              onRemoveMember={(memberId: string) => removeMember(id, memberId)}
            />
          </div>
        </div>
      </div>

      <TaskDialog
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          fetchTasks(currentPage, searchQuery);
        }}
        project_id={id}
        taskToEdit={taskToEdit}
      />

      <InviteMemberDialog
        isOpen={isInviteOpen}
        setIsOpen={setIsInviteOpen}
        currentMembers={currentProject.members}
        creatorId={currentProject.creator.id}
        onInvite={async (userId: string) => {
          await addMember(id, userId);
          setIsInviteOpen(false);
        }}
      />

      <AlertDialog
        open={deleteTaskDialogOpen}
        onOpenChange={setDeleteTaskDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
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

function ProjectHeader({ project, canEdit, onUpdate, onCreateTask }: any) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(project.name);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [desc, setDesc] = useState(project.description);

  const handleNameSave = async () => {
    if (!name.trim()) return;
    await onUpdate(project.id, { name });
    setIsEditingName(false);
  };

  const handleDescSave = async () => {
    await onUpdate(project.id, { description: desc });
    setIsEditingDesc(false);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex-1 space-y-2 max-w-2xl">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-3xl font-bold h-12"
              autoFocus
            />
            <Button size="icon" onClick={handleNameSave}>
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditingName(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <h1
            onClick={() => canEdit && setIsEditingName(true)}
            className={cn(
              "text-3xl font-bold text-gray-900 px-1 -ml-1 rounded transition-colors",
              canEdit && "hover:bg-gray-200 cursor-pointer"
            )}
          >
            {project.name}
          </h1>
        )}

        {isEditingDesc ? (
          <div className="space-y-2">
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleDescSave}>
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
          <p
            onClick={() => canEdit && setIsEditingDesc(true)}
            className={cn(
              "text-gray-500 px-1 -ml-1 rounded transition-colors whitespace-pre-wrap",
              canEdit && "hover:bg-gray-100 cursor-pointer"
            )}
          >
            {project.description || "No description provided."}
          </p>
        )}
      </div>

      <Button onClick={onCreateTask} className="gap-2">
        <Plus className="h-4 w-4" /> Create Task
      </Button>
    </div>
  );
}

function TasksTable({
  tasks,
  loading,
  projectId,
  onTaskClick,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  loading: boolean;
  projectId: string;
  onTaskClick: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No tasks found.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task: Task) => (
          <TableRow
            key={task.id}
            className="group hover:bg-gray-50 cursor-pointer"
            onClick={() => onTaskClick(task)}
          >
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>
              <StatusBadge status={task.status} />
            </TableCell>
            <TableCell>
              <PriorityBadge priority={task.priority} />
            </TableCell>
            <TableCell>
              {task.due_date ? (
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="mr-2 h-3 w-3 text-gray-400" />
                  {format(new Date(task.due_date), "MMM d")}
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {task.assignee.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">
                    {task.assignee.username}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">Unassigned</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TeamSidebar({ project, currentUser, onInvite, onRemoveMember }: any) {
  const canManage =
    currentUser?.role === "Admin" || currentUser?.id === project.creator.id;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Team</h3>
        {canManage && (
          <Button variant="outline" size="sm" onClick={onInvite}>
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 rounded bg-blue-50/50 border border-blue-100">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-blue-100">
              <AvatarFallback className="text-blue-700">
                {project.creator.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {project.creator.username}
              </p>
              <span className="text-[10px] text-blue-600 font-bold uppercase">
                Owner
              </span>
            </div>
          </div>
        </div>

        {project.members.map((member: any) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 rounded hover:bg-gray-50 group"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 bg-gray-100">
                <AvatarFallback>
                  {member.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.username}</p>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => onRemoveMember(member.id)}
                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InviteMemberDialog({
  isOpen,
  setIsOpen,
  currentMembers,
  creatorId,
  onInvite,
}: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [openCombobox, setOpenCombobox] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      API.get("/users")
        .then((res: any) => {
          const available = res.data.filter(
            (u: any) =>
              !currentMembers.some((m: any) => m.id === u.id) &&
              u.id !== creatorId
          );
          setUsers(available);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, currentMembers, creatorId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label>Select User</Label>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between mt-2"
              >
                {selectedUserId
                  ? users.find((u) => u.id === selectedUserId)?.username
                  : "Select user..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandList>
                  <CommandEmpty>
                    {loading ? "Loading..." : "No users found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.username}
                        onSelect={() => {
                          setSelectedUserId(user.id);
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUserId === user.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {user.username}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onInvite(selectedUserId)}
            disabled={!selectedUserId}
          >
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Done: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
    "In Progress":
      "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
    Overdue: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn("border", styles[status] || "bg-gray-100 text-gray-800")}
    >
      {status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    High: "text-red-600 bg-red-50 border-red-100",
    Medium: "text-amber-600 bg-amber-50 border-amber-100",
    Low: "text-green-600 bg-green-50 border-green-100",
  };

  return (
    <Badge variant="outline" className={colors[priority]}>
      {priority}
    </Badge>
  );
}
