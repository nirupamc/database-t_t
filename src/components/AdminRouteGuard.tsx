"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getClientRole } from "@/lib/auth";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const role = getClientRole();
    if (role !== "admin") {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}
