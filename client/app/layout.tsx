import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Navbar } from "@/components/ui/navbar";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Toaster position="top-center" />
        <Navbar />
        {children}
      </body>
    </html>
  );
}