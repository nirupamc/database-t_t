"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session || session.user.role.toUpperCase() !== "ADMIN") {
      router.replace("/login");
    }
  }, [router, session, status]);

  if (status === "loading") {
    return null;
  }

  return <>{children}</>;
}
