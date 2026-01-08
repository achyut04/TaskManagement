"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useRouter } from "next/navigation";
import API from "@/app/utils/api";
import { toast } from "sonner";
import { User } from "@/app/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ManageUsers() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/users");

      const sortedUsers = data.sort((a: User, b: User) => {
        if (a.role === "Admin" && b.role !== "Admin") return -1;
        if (a.role !== "Admin" && b.role === "Admin") return 1;
        return a.username.localeCompare(b.username);
      });

      setUsers(sortedUsers);
    } catch (error: any) {
      toast.error(error.response.data.message);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchUsers();
  }, [user, router]);
  const handlePromote = async (id: string, name: string) => {
    try {
      if (
        confirm(
          "Are you sure you want to promote this user? This cannot be undone."
        )
      ) {
        await API.put(`/users/${id}/promote`);
        toast.success(`${name} is now an Admin!`);
        fetchUsers();
      }
    } catch (error) {
      toast.error("Failed to promote user");
    }
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (!user || (loading && users.length === 0)) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all registered users.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1">
                Total Users: {users.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.username}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === "Admin" ? "default" : "secondary"}
                          className={
                            u.role === "Admin"
                              ? "bg-purple-600 hover:bg-purple-700"
                              : ""
                          }
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role !== "Admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromote(u.id, u.username)}
                          >
                            Promote to Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {totalPages > 1 && (
            <CardFooter className="flex justify-center border-t pt-4">
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
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
