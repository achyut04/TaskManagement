"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import API from "@/app/utils/api";
// import { AddProjectModal } from "@/components/ui/AddProjectModal";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  creator: { username: string };
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get("/projects");
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
    //   fetchProjects();
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-gray-500">
              Welcome back, <span className="font-semibold text-gray-800">{user.username}</span>.
            </p>
          </div>
          
          {/* {user.role === "Admin" && (
            <AddProjectModal onProjectCreated={fetchProjects} />
          )} */}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" /> */}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               📂
            </div>
            <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {user.role === 'Admin' 
                ? "Get started by creating a new project above." 
                : "You haven't been assigned to any projects yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold truncate leading-tight">
                      {project.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="h-24">
                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                    {project.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-gray-50/50 flex justify-between items-center text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">By: {project.creator?.username}</span>
                  </div>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}