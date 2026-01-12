"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CatchAll() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}
