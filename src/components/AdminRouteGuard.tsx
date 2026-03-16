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

    if (!session) {
      // No session - force navigation to login
      window.location.href = "/login";
    } else if (session.user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router, session, status]);

  // Show nothing while loading or if no session (will redirect)
  if (status === "loading" || !session || session.user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
