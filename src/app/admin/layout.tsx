"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopBar } from "@/components/AdminTopBar";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen">
        <AdminSidebar />
        <div className="lg:pl-64">
          <AdminTopBar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
