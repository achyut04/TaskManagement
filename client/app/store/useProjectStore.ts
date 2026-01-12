import { create } from "zustand";
import API from "@/app/utils/api";
import { toast } from "sonner";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { User } from "@/app/types";

export interface Comment {
  id: string;
  content: string;
  createdAt: Timestamp;
  author: User;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: Timestamp;
  actor: User;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  creator: User;
  members: User[];
  tasks?: Task[];
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  taskComments: Comment[];
  totalComments: number;
  hasMoreComments: boolean;
  taskLogs: ActivityLog[];
  loading: boolean;
  fetchProjects: (search?: string) => Promise<void>;
  addProject: (project: Project) => void;
  fetchProjectById: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMember: (projectId: string, userId: string) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  createTask: (taskData: any) => Promise<void>;
  updateTask: (taskId: string, updates: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  fetchTaskComments: (taskId: string, page?: number) => Promise<void>;
  resetComments: () => void;
  addTaskComment: (taskId: string, content: string) => Promise<void>;
  fetchTaskLogs: (taskId: string) => Promise<void>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "To Do" | "In Progress" | "Done" | "Overdue";
  priority: "Low" | "Medium" | "High";
  due_date?: string;
  project_id: string;
  assigned_to_id?: string;
  assignee?: User;
  created_at: Timestamp;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  taskComments: [],
  totalComments: 0,
  hasMoreComments: true,
  taskLogs: [],
  loading: false,

  fetchProjects: async (search?: string) => {
    set({ loading: true });
    try {
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : "";
      const { data } = await API.get(`/project${queryParams}`);
      set({ projects: data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  fetchProjectById: async (id) => {
    set({ loading: true });
    try {
      const { data } = await API.get(`/project/${id}`);
      set({ currentProject: data, loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false });
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const { data } = await API.put(`/project/${id}`, updates);
      set((state) => ({
        currentProject: { ...state.currentProject!, ...data },
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...data } : p
        ),
      }));
    } catch (error: any) {
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await API.delete(`/project/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: null,
      }));
      toast.success("Project deleted");
    } catch (error: any) {
      const errorMessage =
        error.message ||
        error.response?.data?.error?.message ||
        "Delete failed";
      toast.error(errorMessage);
      throw error;
    }
  },

  addMember: async (projectId, userId) => {
    try {
      await API.post(`/project/${projectId}/members`, { userId });
      toast.success("Member added!");
      get().fetchProjectById(projectId);
    } catch (error: any) {
      const errorMessage =
        error.message ||
        error.response?.data?.error?.message ||
        "Failed to add member";
      toast.error(errorMessage);
    }
  },

  removeMember: async (projectId, userId) => {
    try {
      await API.delete(`/project/${projectId}/members/${userId}`);
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            members: state.currentProject.members.filter(
              (m) => m.id !== userId
            ),
          },
        };
      });
      toast.success("Member removed");
    } catch (error: any) {
      const errorMessage =
        error.message ||
        error.response?.data?.error?.message ||
        "Failed to remove member";
      toast.error(errorMessage);
    }
  },

  createTask: async (taskData) => {
    try {
      const { data } = await API.post("/tasks", taskData);
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            tasks: [...(state.currentProject.tasks || []), data],
          },
        };
      });
      toast.success("Task created!");
    } catch (error: any) {
      const errorMessage =
        error.message ||
        error.response?.data?.error?.message ||
        "Failed to create task";
      toast.error(errorMessage);
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const { data } = await API.put(`/tasks/${taskId}`, updates);

      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            tasks: state.currentProject.tasks?.map((t) =>
              t.id === taskId ? data : t
            ),
          },
        };
      });

      if (get().taskLogs.length > 0) {
        get().fetchTaskLogs(taskId);
      }
    } catch (error: any) {
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await API.delete(`/tasks/${taskId}`);
      set((state) => {
        if (!state.currentProject) return {};
        return {
          currentProject: {
            ...state.currentProject,
            tasks: state.currentProject.tasks?.filter((t) => t.id !== taskId),
          },
        };
      });
      toast.success("Task deleted");
    } catch (error: any) {
      toast.error("Failed to delete task");
    }
  },

  fetchTaskComments: async (taskId, page = 1) => {
    try {
      const { data } = await API.get(
        `/tasks/${taskId}/comments?page=${page}&limit=10`
      );
      set((state) => {
        const newComments =
          page === 1
            ? data.comments
            : [...state.taskComments, ...data.comments];

        return {
          taskComments: newComments,
          totalComments: data.totalComments,
          hasMoreComments: data.hasMore,
        };
      });
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  },

  resetComments() {
    set({ taskComments: [], totalComments: 0, hasMoreComments: true });
  },

  addTaskComment: async (taskId, content) => {
    try {
      const { data } = await API.post(`/tasks/${taskId}/comments`, { content });
      set((state) => ({
        taskComments: [data, ...state.taskComments],
      }));
      get().fetchTaskLogs(taskId);
      toast.success("Comment added");
    } catch (error: any) {
      toast.error("Failed to post comment");
      throw error;
    }
  },

  fetchTaskLogs: async (taskId) => {
    try {
      const { data } = await API.get(`/tasks/${taskId}/activity`);
      set({ taskLogs: data });
    } catch (error) {
      console.error("Failed to fetch activity logs", error);
    }
  },
}));
