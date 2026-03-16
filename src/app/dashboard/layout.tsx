"use client";

import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { RecruiterRouteGuard } from "@/components/RecruiterRouteGuard";

/** Dashboard layout – sidebar + top bar wrapping all /dashboard/* routes */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RecruiterRouteGuard>
      <div className="min-h-screen">
        <Sidebar />
        <div className="lg:pl-64">
          <TopBar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </RecruiterRouteGuard>
  );
}
