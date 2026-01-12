"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, FolderOpen, Calendar, User } from "lucide-react";

import { useAuthStore } from "@/app/store/useAuthStore";
import { useProjectStore } from "@/app/store/useProjectStore";

import { AddProjectModal } from "@/components/ui/addProjectModal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function Dashboard() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const { projects, loading, fetchProjects } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const delay = searchQuery ? 500 : 0;
    const timeoutId = setTimeout(() => {
      fetchProjects(searchQuery || undefined);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchProjects]);

  if (!isMounted || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back,{" "}
              <span className="font-semibold text-gray-900">
                {user.username}
              </span>
            </p>
          </div>
          {user.role === "Admin" && <AddProjectModal />}
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            className="pl-10 bg-white border-gray-200 focus:ring-2 focus:ring-blue-100 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            isAdmin={user.role === "Admin"}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                currentUser={user.username}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  currentUser,
}: {
  project: any;
  currentUser: string;
}) {
  const isOwner = project.creator?.username === currentUser;

  return (
    <Link href={`/projects/${project.id}`} className="block h-full group">
      <Card className="h-full hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold truncate leading-tight group-hover:text-blue-600 transition-colors">
            {project.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow">
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
            {project.description || "No description provided."}
          </p>
        </CardContent>

        <CardFooter className="pt-4 border-t bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className={isOwner ? "font-medium text-blue-600" : ""}>
              {isOwner ? "You" : project.creator?.username}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

function EmptyState({
  searchQuery,
  isAdmin,
}: {
  searchQuery: string;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
      <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
        <FolderOpen size={24} />
      </div>
      <h3 className="text-lg font-medium text-gray-900">
        {searchQuery ? "No projects found" : "No projects yet"}
      </h3>
      <p className="text-gray-500 text-sm mt-1 max-w-sm text-center">
        {searchQuery
          ? `We couldn't find anything matching "${searchQuery}".`
          : isAdmin
          ? "Get started by creating a new project using the button above."
          : "You haven't been assigned to any projects yet."}
      </p>
    </div>
  );
}
