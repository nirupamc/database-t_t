"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function RecruiterRouteGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace("/login");
    } else if (session.user.role === "admin") {
      router.replace("/admin");
    }
  }, [router, session, status]);

  if (status === "loading") return null;

  return <>{children}</>;
}
