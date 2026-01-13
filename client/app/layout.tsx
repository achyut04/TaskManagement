import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 overflow-hidden">
        <Toaster position="top-center" />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
