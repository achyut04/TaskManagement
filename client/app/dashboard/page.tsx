"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useProjectStore } from "@/app/store/useProjectStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

import { AddProjectModal } from "@/components/ui/addProjectModal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { projects, loading, fetchProjects } = useProjectStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchProjects();
    }
  }, [router, fetchProjects]);

  if (!user) return null;

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              DashBoard
            </h1>
            <p className="text-gray-500">
              Welcome back,{" "}
              <span className="font-semibold text-gray-800">
                {user.username}
              </span>
              .
            </p>
          </div>
          {user.role === "Admin" && <AddProjectModal />}
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search projects..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex min-h-screen items-center justify-center p-8">
            <Spinner />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              📂
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {searchQuery
                ? "No projects match your search"
                : "No projects found"}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery
                ? "Try searching for a different name or description."
                : user.role === "Admin"
                ? "Get started by creating a new project above."
                : "You haven't been assigned to any projects yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block h-full"
              >
                <Card className="group h-full hover:shadow-lg transition-all duration-200 border-gray-200 cursor-pointer flex flex-col w-full overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-semibold truncate leading-tight group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs font-normal">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed break-all">
                      {project.description || "No description provided."}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-4 border-t bg-gray-50/50 flex justify-between items-center text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">
                        {project.creator?.username === user.username
                          ? "Created by You"
                          : `By: ${project.creator?.username}`}
                      </span>
                    </div>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
