"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore, Task } from "@/app/store/useProjectStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import API from "@/app/utils/api";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

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
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";
import { Spinner } from "@/components/ui/spinner";

export default function ProjectDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");

  const { user, token } = useAuthStore();
  const {
    currentProject,
    loading,
    fetchProjectById,
    deleteTask,
    removeMember,
    addMember,
    updateProject,
  } = useProjectStore();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const [searchQuery, setSearchQuery] = useState("");

  const [availableUsers, setAvailableUsers] = useState<
    { id: string; username: string }[]
  >([]);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProjectById(id).catch(() => router.push("/dashboard"));
  }, [id, fetchProjectById, router, user]);

  useEffect(() => {
    if (currentProject) {
      if (!isEditingName) setEditName(currentProject.name);
      if (!isEditingDesc) setEditDesc(currentProject.description || "");
    }
  }, [currentProject, isEditingName, isEditingDesc]);

  useEffect(() => {
    if (isInviteOpen) {
      const fetchUsers = async () => {
        try {
          const { data } = await API.get("/users");
          const nonMembers = data.filter(
            (u: any) =>
              !currentProject?.members.some((m) => m.id === u.id) &&
              u.id !== currentProject?.creator.id
          );
          setAvailableUsers(nonMembers);
        } catch (error) {
          console.error("Failed to load users");
        }
      };
      fetchUsers();
    }
  }, [isInviteOpen, currentProject]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const canEditProject =
    user?.role === "Admin" || user?.id === currentProject?.creator?.id;

  const handleUpdateProjectName = async () => {
    if (!editName.trim()) return;
    try {
      await updateProject(id, { name: editName });
      setIsEditingName(false);
      toast.success("Project name updated");
    } catch (error) {
      toast.error("Failed to update project name");
    }
  };

  const handleUpdateProjectDesc = async () => {
    try {
      await updateProject(id, { description: editDesc });
      setIsEditingDesc(false);
      toast.success("Description updated");
    } catch (error) {
      toast.error("Failed to update description");
    }
  };

  const handleCreateTask = () => {
    setTaskToEdit(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Delete this task?")) {
      await deleteTask(taskId);
    }
  };

  const handleRemoveMember = async (id: string, userId: string) => {
    if (confirm("Remove this member?")) {
      await removeMember(id, userId);
    }
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/projects/${id}/tasks/${task.id}`);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId.trim()) return;

    await addMember(id, inviteUserId);

    setInviteUserId("");
    setIsInviteOpen(false);
  };

  const getPriorityColor = (p: string) => {
    if (p === "High") return "bg-red-100 text-red-800 hover:bg-red-100";
    if (p === "Medium")
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    return "bg-green-100 text-green-800 hover:bg-green-100";
  };

  const getStatusColor = (s: string) => {
    if (s === "Done") return "bg-green-400 hover:bg-green-500 text-black";
    if (s === "In Progress") return "bg-blue-400 hover:bg-blue-500 text-black";
    if (s === "Overdue")
      return "border-transparent bg-destructive/60 text-black [a&]:hover:bg-destructive/70 focus-visible:ring-destructive/50 dark:focus-visible:ring-destructive/80 dark:bg-destructive/50";
    return "bg-gray-400 hover:bg-gray-500 text-white";
  };

  if (loading || !currentProject)
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Spinner />
      </div>
    );

  const tasks = currentProject.tasks || [];

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1 space-y-2 max-w-2xl">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-3xl font-bold h-12"
                  autoFocus
                />
                <Button size="icon" onClick={handleUpdateProjectName}>
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
                onClick={() => canEditProject && setIsEditingName(true)}
                className={cn(
                  "text-3xl font-bold text-gray-900 border border-transparent rounded px-2 -ml-2 py-1 transition-colors",
                  canEditProject &&
                    "hover:bg-gray-100 hover:border-gray-200 cursor-pointer"
                )}
              >
                {currentProject.name}
              </h1>
            )}

            {isEditingDesc ? (
              <div className="space-y-2">
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="h-[250px] resize-none overflow-y-auto text-base leading-relaxed p-4"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateProjectDesc}>
                    Save Description
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
                onClick={() => canEditProject && setIsEditingDesc(true)}
                className={cn(
                  "text-gray-500 border border-transparent rounded px-2 -ml-2 py-1 transition-colors whitespace-pre-wrap",
                  canEditProject &&
                    "hover:bg-gray-100 hover:border-gray-200 cursor-pointer"
                )}
              >
                {currentProject.description || "No description provided."}
              </p>
            )}
          </div>

          <div className="flex gap-2 self-start">
            <Button
              onClick={handleCreateTask}
              className="gap-2 bgcolor-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Task
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <h3 className="font-semibold text-gray-700">Tasks</h3>
                  <Badge variant="outline">
                    {filteredTasks.length} / {currentProject.tasks?.length || 0}
                  </Badge>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white"
                  />
                </div>
              </div>

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
                  {currentTasks.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        {searchQuery
                          ? "No tasks found matching your search."
                          : "No tasks yet. Create one to get started!"}
                      </TableCell>
                    </TableRow>
                  )}
                  {currentTasks.map((task: any) => (
                    <TableRow
                      key={task.id}
                      className="group cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleTaskClick(task)}
                    >
                      <TableCell className="max-w-[200px] sm:max-w-[300px]">
                        <div
                          className="font-medium text-gray-900 truncate"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={"default"}
                          className={getStatusColor(task.status)}
                        >
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getPriorityColor(
                            task.priority
                          )} border-0`}
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.due_date ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarIcon className="mr-2 h-3 w-3 text-gray-400" />
                            {format(new Date(task.due_date), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {task.assignee.username
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">
                              {task.assignee.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task);
                              }}
                            >
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="text-red-600 focus:text-red-600"
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
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => paginate(currentPage - 1)}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <PaginationItem key={number}>
                        <PaginationLink
                          onClick={() => paginate(number)}
                          isActive={currentPage === number}
                          className="cursor-pointer"
                        >
                          {number}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => paginate(currentPage + 1)}
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
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Team Members</h3>
                {user?.role === "Admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInviteOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 bg-blue-100 border-2 border-white shadow-sm">
                      <AvatarFallback className="text-blue-700 font-bold">
                        {currentProject.creator.username
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {currentProject.creator.username}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200">
                        Owner
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 my-2"></div>

                {currentProject.members.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    No other members yet.
                  </p>
                ) : (
                  currentProject.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-gray-100">
                          <AvatarFallback className="text-gray-600">
                            {member.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {member.username}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      {(user?.role === "Admin" ||
                        user?.id === currentProject.creator.id) && (
                        <button
                          onClick={() => handleRemoveMember(id, member.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                          title="Remove Member"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskDialog
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        project_id={id}
        taskToEdit={taskToEdit}
      />

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="overflow-visible">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label>Search User</Label>

              <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isComboboxOpen}
                    className="w-full justify-between"
                  >
                    {inviteUserId
                      ? availableUsers.find((user) => user.id === inviteUserId)
                          ?.username
                      : "Select user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search username..." />
                    <CommandList>
                      <CommandEmpty>No user found.</CommandEmpty>
                      <CommandGroup>
                        {availableUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.username}
                            onSelect={() => {
                              setInviteUserId(
                                user.id === inviteUserId ? "" : user.id
                              );
                              setIsComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                inviteUserId === user.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{user.username}</span>
                              <span className="text-[10px] text-gray-400">
                                ID: {user.id.slice(0, 8)}...
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <p className="text-xs text-gray-500">
                Only showing users who are not already in this project.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!inviteUserId}>
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
