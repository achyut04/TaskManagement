import { create } from "zustand";
import API from "@/app/utils/api";
import { toast } from "sonner";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  creator: { username: string; id: string };
  members: { id: string; username: string; email: string; role?: string }[];
  tasks?: Task[];
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  addProject: (project: Project) => void;
  fetchProjectById: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMember: (projectId: string, userId: string) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  createTask: (taskData: any) => Promise<void>;
  updateTask: (taskId: string, updates: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  due_date?: string;
  project_id: string;
  assigned_to_id?: string;
  assignee?: { id: string; username: string };
  created_at: Timestamp
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: true,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const { data } = await API.get("/project");
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
      toast.success("Project updated!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
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
      toast.error(error.response?.data?.message || "Delete failed");
      throw error;
    }
  },

  addMember: async (projectId, userId) => {
    try {
      await API.post(`/project/${projectId}/members`, { userId });
      toast.success("Member added!");
      get().fetchProjectById(projectId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add member");
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
      toast.error(error.response?.data?.message || "Failed to remove member");
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
      toast.error(error.response?.data?.message || "Failed to create task");
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
      toast.success("Task updated");
    } catch (error: any) {
      toast.error("Failed to update task");
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
}));
