"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/candidates", label: "Candidates", icon: UserRound },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-md bg-primary p-2 text-primary-foreground shadow-lg lg:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle admin sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/20">
            <Image src="/tantech-logo.svg" alt="Tantech" width={24} height={24} className="invert" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-yellow-400">Tantech</p>
            <p className="text-xs text-white/60">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isEmployees = item.label === "Employees" && pathname.startsWith("/admin/employees");
            const isCandidates = item.label === "Candidates" && pathname.startsWith("/admin/candidates");
            const isDashboard = item.label === "Dashboard" && pathname === "/admin";
            const isSettings = item.label === "Settings" && pathname === "/admin/settings";
            const isActive = isEmployees || isCandidates || isDashboard || isSettings;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-active text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
