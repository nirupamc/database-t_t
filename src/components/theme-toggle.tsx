"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeName = "light" | "dark" | "system";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("grid grid-cols-3 gap-2", className)}>
        <Button type="button" variant="outline" size="sm" disabled>
          <Sun className="mr-2 h-4 w-4" /> Light
        </Button>
        <Button type="button" variant="outline" size="sm" disabled>
          <Moon className="mr-2 h-4 w-4" /> Dark
        </Button>
        <Button type="button" variant="outline" size="sm" disabled>
          System
        </Button>
      </div>
    );
  }

  const options: Array<{ value: ThemeName; label: string; icon?: ReactNode }> = [
    { value: "light", label: "Light", icon: <Sun className="mr-2 h-4 w-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="mr-2 h-4 w-4" /> },
    { value: "system", label: "System" },
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {options.map((option) => {
        const isActive = theme === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme(option.value)}
            className="justify-center"
          >
            {option.icon}
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
