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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
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

export default function ManageUsers() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const usersPerPage = 10;
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [userToPromote, setUserToPromote] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchUsers = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const response = (await API.get(
        `/users?page=${page}&limit=${usersPerPage}`
      )) as any;
      const { data, meta } = response;

      setUsers(data);
      if (meta?.pagination) {
        setTotalPages(meta.pagination.totalPages);
        setTotalItems(meta.pagination.totalItems);
      }
    } catch (error: any) {
      const errorMessage =
        error.details ||
        error.message ||
        error.response?.data?.error?.message ||
        "Failed to fetch users";
      toast.error(errorMessage);
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
    fetchUsers(1);
  }, [user, router]);

  const handlePromoteClick = (id: string, name: string) => {
    setUserToPromote({ id, name });
    setPromoteDialogOpen(true);
  };

  const handlePromote = async () => {
    if (!userToPromote) return;
    try {
      await API.put(`/users/${userToPromote.id}/promote`);
      toast.success(`${userToPromote.name} is now an Admin!`);
      fetchUsers(currentPage);
      setPromoteDialogOpen(false);
      setUserToPromote(null);
    } catch (error) {
      toast.error("Failed to promote user");
    }
  };

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      fetchUsers(pageNumber);
    }
  };

  if (!user || (loading && users.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
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
                Total Users: {totalItems}
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Spinner />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.username}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === "Admin" ? "default" : "secondary"
                            }
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
                              onClick={() =>
                                handlePromoteClick(u.id, u.username)
                              }
                            >
                              Promote to Admin
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                      onClick={() => !loading && paginate(currentPage - 1)}
                      className={
                        currentPage === 1 || loading
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <PaginationItem key={number}>
                        <PaginationLink
                          onClick={() => !loading && paginate(number)}
                          isActive={currentPage === number}
                          className={
                            loading
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        >
                          {number}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => !loading && paginate(currentPage + 1)}
                      className={
                        currentPage === totalPages || loading
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

      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote this user? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote}>
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
