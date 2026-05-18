"use client";

import { Bell, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search/search-input";
import { useSearch } from "@/components/search/search-provider";

export function AdminTopBar() {
  const { data: session } = useSession();
  const { openSearch } = useSearch();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const name = session?.user?.name ?? "Admin";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="w-10 lg:hidden" />
      <div className="hidden lg:block">
        <p className="text-sm text-muted-foreground">
          Welcome, <span className="font-semibold text-foreground">Admin {name.split(" ")[0]}</span>
        </p>
      </div>

      {/* Search input */}
      <div className="flex-1 px-4 hidden sm:block">
        <SearchInput onClick={openSearch} />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative rounded-full p-2 transition-colors hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </header>
  );
}
