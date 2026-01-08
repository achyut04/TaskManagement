"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/app/store/useProjectStore";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: any;
  project_id: string;
}

export function TaskDialog({
  isOpen,
  onClose,
  taskToEdit,
  project_id,
}: TaskDialogProps) {
  const { createTask, updateTask, currentProject } = useProjectStore();
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("12:00");
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Todo",
    priority: "Medium",
    assigned_to_id: "unassigned",
  });

  useEffect(() => {
    if (taskToEdit) {
      setForm({
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        status: taskToEdit.status,
        priority: taskToEdit.priority,
        assigned_to_id: taskToEdit.assigned_to_id || "unassigned",
      });

      if (taskToEdit.due_date) {
        const d = new Date(taskToEdit.due_date);
        setDate(d);
        setTime(format(d, "HH:mm"));
      } else {
        setDate(undefined);
        setTime("12:00");
      }
    } else {
      setForm({
        title: "",
        description: "",
        status: "Todo",
        priority: "Medium",
        assigned_to_id: "unassigned",
      });
      setDate(undefined);
      setTime("12:00");
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let dueDate: string | null = null;
    if (date) {
      const [hours, minutes] = time.split(":").map(Number);
      const combined = new Date(date);
      combined.setHours(hours, minutes, 0, 0);
      dueDate = combined.toISOString();
    }

    const payload = {
      ...form,
      project_id,
      assigned_to_id:
        form.assigned_to_id === "unassigned" ? null : form.assigned_to_id,
      due_date: dueDate,
    };

    if (taskToEdit) {
      await updateTask(taskToEdit.id, payload);
    } else {
      await createTask(payload);
    }

    setLoading(false);
    onClose();
  };

  const assignee =
    currentProject?.members.find((m) => m.id === form.assigned_to_id) || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {taskToEdit ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Task Title</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm({ ...form, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(val) => setForm({ ...form, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  {assignee ? assignee.username : "Unassigned"}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search member..." />
                  <CommandList>
                    <CommandEmpty>No member found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setForm({
                            ...form,
                            assigned_to_id: "unassigned",
                          });
                          setAssigneeOpen(false);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Unassigned
                      </CommandItem>

                      {currentProject?.members.map((m) => (
                        <CommandItem
                          key={m.id}
                          onSelect={() => {
                            setForm({
                              ...form,
                              assigned_to_id: m.id,
                            });
                            setAssigneeOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.assigned_to_id === m.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {m.username}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              className="h-[250px] resize-none overflow-y-auto text-base leading-relaxed p-4"
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : taskToEdit
                ? "Save Changes"
                : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
