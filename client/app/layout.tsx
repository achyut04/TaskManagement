import type { Metadata } from "next";
import { AuthProvider } from "@/app/context/AuthContext"; // Check this path matches your folder
import { Toaster } from "sonner";
import { Navbar } from "@/components/ui/navbar"; // Check this path matches your folder
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Team Task Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <AuthProvider>
          <Toaster position="top-center" />

          <Navbar />

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
